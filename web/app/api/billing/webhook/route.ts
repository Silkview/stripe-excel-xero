import { getStripe } from '@/lib/stripe-billing';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

const PLAN_LIMITS: Record<
  string,
  { plan: string; max_users: number; max_workspaces: number }
> = {
  [process.env.STRIPE_PRO_PRICE_ID ?? '']: {
    plan: 'pro',
    max_users: 1,
    max_workspaces: 1,
  },
  [process.env.STRIPE_FIRM_PRICE_ID ?? '']: {
    plan: 'firm',
    max_users: 5,
    max_workspaces: 5,
  },
};

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

  const supabase = createSupabaseAdmin();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId = session.metadata?.accountId;
      if (!accountId || !session.subscription) break;
      const sub = await getStripe().subscriptions.retrieve(
        session.subscription as string
      );
      const priceId = sub.items.data[0]?.price.id ?? '';
      const limits = PLAN_LIMITS[priceId];
      await core(supabase)
        .from('accounts')
        .update({
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
          plan: limits?.plan ?? 'pro',
          max_users: limits?.max_users ?? 1,
          max_workspaces: limits?.max_workspaces ?? 1,
          current_period_end: new Date(
            sub.current_period_end * 1000
          ).toISOString(),
        })
        .eq('id', accountId);
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id ?? '';
      const limits = PLAN_LIMITS[priceId];
      await core(supabase)
        .from('accounts')
        .update({
          subscription_status: sub.status,
          plan: limits?.plan ?? 'pro',
          max_users: limits?.max_users ?? 1,
          max_workspaces: limits?.max_workspaces ?? 1,
          current_period_end: new Date(
            sub.current_period_end * 1000
          ).toISOString(),
        })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await core(supabase)
        .from('accounts')
        .update({
          subscription_status: 'canceled',
          plan: 'canceled',
          max_users: 0,
          max_workspaces: 0,
        })
        .eq('stripe_subscription_id', sub.id);
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
      break;
    }
  }

  return NextResponse.json({ received: true });
}
