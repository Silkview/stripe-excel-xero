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

function subscriptionUpdateFields(
  subscription: Stripe.Subscription,
  limits: Awaited<ReturnType<typeof limitsForPriceId>>
) {
  const fields: {
    stripe_subscription_id: string;
    subscription_status: string;
    plan_code: PlanCode;
    plan: PlanCode;
    max_users: number;
    max_workspaces: number;
    current_period_end: string;
    trial_ends_at?: null;
  } = {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    plan_code: limits.plan_code,
    plan: limits.plan,
    max_users: limits.max_users,
    max_workspaces: limits.max_workspaces,
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
  };

  if (subscription.status === 'active') {
    fields.trial_ends_at = null;
  }

  return fields;
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
    .update(subscriptionUpdateFields(subscription, limits))
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

function resolveSubscriptionFromSession(
  session: Stripe.Checkout.Session
): Stripe.Subscription | null {
  const sub = session.subscription;
  if (!sub || typeof sub === 'string') return null;
  return sub;
}

export async function syncAccountFromCheckoutSession(
  accountId: string,
  sessionId: string
): Promise<{ planCode: PlanCode; subscriptionStatus: string }> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  if (session.metadata?.accountId !== accountId) {
    throw new Error('Checkout session does not belong to this account.');
  }

  const paymentOk =
    session.payment_status === 'paid' ||
    session.payment_status === 'no_payment_required';

  if (!paymentOk) {
    if (session.payment_status === 'unpaid') {
      throw new Error(
        'Payment is still processing. Wait a moment and refresh this page.'
      );
    }
    throw new Error('Checkout session payment is not complete.');
  }

  let subscription = resolveSubscriptionFromSession(session);

  if (!subscription && session.subscription) {
    subscription = await getStripe().subscriptions.retrieve(
      session.subscription as string
    );
  }

  if (!subscription) {
    throw new Error('Checkout session has no subscription.');
  }

  return syncAccountFromStripeSubscription(accountId, subscription);
}

export async function updateAccountFromSubscriptionEvent(
  subscription: Stripe.Subscription
): Promise<void> {
  const priceId = subscription.items.data[0]?.price.id ?? '';
  const limits = await limitsForPriceId(priceId);
  const admin = createSupabaseAdmin();

  await core(admin)
    .from('accounts')
    .update(subscriptionUpdateFields(subscription, limits))
    .eq('stripe_subscription_id', subscription.id);
}

export async function syncAccountFromSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  const accountId = subscription.metadata?.accountId;
  if (!accountId) return;
  await syncAccountFromStripeSubscription(accountId, subscription);
}

export async function syncAccountFromInvoicePaid(
  invoice: Stripe.Invoice
): Promise<void> {
  const admin = createSupabaseAdmin();
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;

  if (subscriptionId) {
    const sub = await getStripe().subscriptions.retrieve(subscriptionId);
    const accountId = sub.metadata?.accountId;
    if (accountId) {
      await syncAccountFromStripeSubscription(accountId, sub);
      return;
    }
    await updateAccountFromSubscriptionEvent(sub);
    return;
  }

  await core(admin)
    .from('accounts')
    .update({ subscription_status: 'active' })
    .eq('stripe_customer_id', customerId);
}
