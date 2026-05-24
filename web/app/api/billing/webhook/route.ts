import { getPlanByCode } from '@/lib/plans/catalog';
import type { PlanCode } from '@/lib/plans/types';
import { getStripe } from '@/lib/stripe-billing';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

async function limitsForPriceId(priceId: string) {
  const proId = process.env.STRIPE_PRO_PRICE_ID ?? '';
  const firmId = process.env.STRIPE_FIRM_PRICE_ID ?? '';
  const code: PlanCode =
    priceId === firmId ? 'firm' : priceId === proId ? 'pro' : 'pro';
  const plan = await getPlanByCode(code);
  return {
    plan_code: code,
    plan: code,
    max_users: plan?.max_users ?? 1,
    max_workspaces: plan?.max_workspaces ?? 1,
  };
}

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
      const limits = await limitsForPriceId(priceId);
      await core(supabase)
        .from('accounts')
        .update({
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
          plan_code: limits.plan_code,
          plan: limits.plan,
          max_users: limits.max_users,
          max_workspaces: limits.max_workspaces,
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
      const limits = await limitsForPriceId(priceId);
      await core(supabase)
        .from('accounts')
        .update({
          subscription_status: sub.status,
          plan_code: limits.plan_code,
          plan: limits.plan,
          max_users: limits.max_users,
          max_workspaces: limits.max_workspaces,
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
          stripe_subscription_id: null,
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
