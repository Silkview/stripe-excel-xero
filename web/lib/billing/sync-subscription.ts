import { getPlanByCode } from '@/lib/plans/catalog';
import type { PlanCode } from '@/lib/plans/types';
import { getStripe } from '@/lib/stripe-billing';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import type Stripe from 'stripe';

export async function limitsForPriceId(priceId: string) {
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

export async function syncAccountFromStripeSubscription(
  accountId: string,
  subscription: Stripe.Subscription
): Promise<{ planCode: PlanCode; subscriptionStatus: string }> {
  const priceId = subscription.items.data[0]?.price.id ?? '';
  const limits = await limitsForPriceId(priceId);
  const admin = createSupabaseAdmin();

  await core(admin)
    .from('accounts')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      plan_code: limits.plan_code,
      plan: limits.plan,
      max_users: limits.max_users,
      max_workspaces: limits.max_workspaces,
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq('id', accountId);

  return {
    planCode: limits.plan_code,
    subscriptionStatus: subscription.status,
  };
}

export async function syncAccountFromStripeSubscriptionById(
  subscriptionId: string
): Promise<void> {
  const sub = await getStripe().subscriptions.retrieve(subscriptionId);
  const accountId = sub.metadata?.accountId;
  if (!accountId) return;
  await syncAccountFromStripeSubscription(accountId, sub);
}

export async function syncAccountFromCheckoutSession(
  accountId: string,
  sessionId: string
): Promise<{ planCode: PlanCode; subscriptionStatus: string }> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);

  if (session.metadata?.accountId !== accountId) {
    throw new Error('Checkout session does not belong to this account.');
  }

  if (session.payment_status !== 'paid') {
    throw new Error('Checkout session payment is not complete.');
  }

  if (!session.subscription) {
    throw new Error('Checkout session has no subscription.');
  }

  const sub = await getStripe().subscriptions.retrieve(
    session.subscription as string
  );

  return syncAccountFromStripeSubscription(accountId, sub);
}

export async function updateAccountFromSubscriptionEvent(
  subscription: Stripe.Subscription
): Promise<void> {
  const priceId = subscription.items.data[0]?.price.id ?? '';
  const limits = await limitsForPriceId(priceId);
  const admin = createSupabaseAdmin();

  await core(admin)
    .from('accounts')
    .update({
      subscription_status: subscription.status,
      plan_code: limits.plan_code,
      plan: limits.plan,
      max_users: limits.max_users,
      max_workspaces: limits.max_workspaces,
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}
