import {
  markBillingEventByStripeId,
  recordBillingEvent,
  updateBillingEventByStripeId,
} from '@/lib/billing/record-event';
import {
  syncAccountFromInvoicePaid,
  syncAccountFromStripeSubscription,
  syncAccountFromSubscriptionCreated,
  updateAccountFromSubscriptionEvent,
} from '@/lib/billing/sync-subscription';
import { getStripe } from '@/lib/stripe-billing';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import type { Json } from '@/types/database.types';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { duplicate } = await recordBillingEvent({
    source: 'webhook',
    stripeEventId: event.id,
    eventType: event.type,
    status: 'received',
    payload: event as unknown as Json,
  });

  if (duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const supabase = createSupabaseAdmin();

  try {
    if (!HANDLED_EVENTS.has(event.type)) {
      await markBillingEventByStripeId(event.id, 'ignored');
      return NextResponse.json({ received: true });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const accountId = session.metadata?.accountId;
        if (!accountId || !session.subscription) {
          await markBillingEventByStripeId(event.id, 'ignored');
          return NextResponse.json({ received: true });
        }
        const sub = await getStripe().subscriptions.retrieve(
          session.subscription as string
        );
        await syncAccountFromStripeSubscription(accountId, sub);
        await updateBillingEventByStripeId(event.id, {
          accountId,
          stripeCustomerId:
            typeof session.customer === 'string'
              ? session.customer
              : session.customer?.id,
          stripeSubscriptionId: sub.id,
          checkoutSessionId: session.id,
        });
        break;
      }
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        await syncAccountFromSubscriptionCreated(sub);
        await updateBillingEventByStripeId(event.id, {
          accountId: sub.metadata?.accountId ?? null,
          stripeCustomerId:
            typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
          stripeSubscriptionId: sub.id,
        });
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await updateAccountFromSubscriptionEvent(sub);
        await updateBillingEventByStripeId(event.id, {
          accountId: sub.metadata?.accountId ?? null,
          stripeSubscriptionId: sub.id,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await core(supabase)
          .from('accounts')
          .update({
            subscription_status: 'canceled',
            stripe_subscription_id: null,
          })
          .eq('stripe_subscription_id', sub.id);
        await updateBillingEventByStripeId(event.id, {
          accountId: sub.metadata?.accountId ?? null,
          stripeSubscriptionId: sub.id,
        });
        break;
      }
      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice;
        await syncAccountFromInvoicePaid(inv);
        await updateBillingEventByStripeId(event.id, {
          stripeCustomerId:
            typeof inv.customer === 'string' ? inv.customer : inv.customer?.id,
          stripeSubscriptionId:
            typeof inv.subscription === 'string'
              ? inv.subscription
              : inv.subscription?.id,
          invoiceId: inv.id,
          amountCents: inv.amount_paid ?? null,
          currency: inv.currency ?? null,
        });
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        const customerId =
          typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
        if (customerId) {
          await core(supabase)
            .from('accounts')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', customerId);
        }
        await updateBillingEventByStripeId(event.id, {
          stripeCustomerId: customerId,
          invoiceId: inv.id,
        });
        break;
      }
    }

    await markBillingEventByStripeId(event.id, 'processed');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markBillingEventByStripeId(event.id, 'failed', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
