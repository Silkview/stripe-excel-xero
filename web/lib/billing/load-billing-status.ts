import type { BillingAccess } from '@/lib/billing/access';
import { getPrimaryAccountMembership } from '@/lib/auth/account-membership';
import { countAccountStripeConnections } from '@/lib/auth/onboarding-status';
import { getBillingState } from '@/lib/billing/access';
import { planDisplayName } from '@/lib/plans/display';
import type { PlanCode } from '@/lib/plans/types';
import { getPlanByCode } from '@/lib/plans/catalog';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';

export type BillingStatusPayload = {
  planCode: PlanCode;
  planLabel: string;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  hasPaidSubscription: boolean;
  needsCheckout: boolean;
  billingBlocked: boolean;
  needsDowngradeSelection: boolean;
  hasStripeCustomer: boolean;
  stripeSubscriptionId: string | null;
  billingAccess: BillingAccess;
  productBlocked: boolean;
  limits: {
    maxWorkspaces: number;
    maxUsers: number;
    maxStripeConnections: number;
    workspaceCount: number;
    userCount: number;
    stripeConnectionCount: number;
  };
};

export async function loadBillingStatusForAccount(
  accountId: string
): Promise<BillingStatusPayload> {
  const admin = createSupabaseAdmin();
  const { data: account } = await core(admin)
    .from('accounts')
    .select(
      'plan_code, subscription_status, trial_ends_at, max_users, max_workspaces, stripe_subscription_id'
    )
    .eq('id', accountId)
    .single();

  if (!account) {
    throw new Error('Account not found.');
  }

  const planCode = (account.plan_code ?? 'free') as PlanCode;
  const plan = await getPlanByCode(planCode);
  const billingState = await getBillingState(accountId);

  const { count: workspaceCount } = await core(admin)
    .from('workspaces')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId);

  const { count: userCount } = await core(admin)
    .from('account_users')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId);

  const { count: pendingInvites } = await core(admin)
    .from('account_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .is('accepted_at', null);

  const stripeConnectionCount = await countAccountStripeConnections(accountId);

  const trialEndsAt = account.trial_ends_at;
  const trialDaysRemaining =
    account.subscription_status === 'trialing' && trialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(trialEndsAt).getTime() - Date.now()) / 86400000
          )
        )
      : null;

  const stripeSubscriptionId = account.stripe_subscription_id ?? null;
  const hasPaidSubscription =
    account.subscription_status === 'active' && !!stripeSubscriptionId;
  const isPaidPlan = planCode === 'pro' || planCode === 'firm';
  const needsCheckout =
    billingState.billingAccess !== 'active' ||
    (isPaidPlan && !hasPaidSubscription);

  return {
    planCode,
    planLabel: planDisplayName(planCode),
    subscriptionStatus: account.subscription_status,
    trialEndsAt,
    trialDaysRemaining,
    hasPaidSubscription,
    needsCheckout,
    billingBlocked: billingState.billingAccess !== 'active',
    needsDowngradeSelection: billingState.needsDowngradeSelection,
    hasStripeCustomer: billingState.hasStripeCustomer,
    stripeSubscriptionId,
    billingAccess: billingState.billingAccess,
    productBlocked:
      billingState.billingAccess !== 'active' ||
      billingState.needsDowngradeSelection,
    limits: {
      maxWorkspaces: plan?.max_workspaces ?? account.max_workspaces,
      maxUsers: plan?.max_users ?? account.max_users,
      maxStripeConnections: plan?.max_stripe_connections ?? 1,
      workspaceCount: workspaceCount ?? 0,
      userCount: (userCount ?? 0) + (pendingInvites ?? 0),
      stripeConnectionCount,
    },
  };
}

export async function loadBillingStatusForUser(
  userId: string
): Promise<BillingStatusPayload | null> {
  const membership = await getPrimaryAccountMembership(userId);
  if (!membership) return null;
  return loadBillingStatusForAccount(membership.account_id);
}
