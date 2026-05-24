import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import type { PlanCode } from '@/lib/plans/types';

export type BillingAccess = 'active' | 'trial_expired' | 'payment_required';

export class BillingRequiredError extends Error {
  readonly code = 'BILLING_REQUIRED';

  constructor(
    message = 'Your trial has ended. Subscribe to continue using Silkview Connect.'
  ) {
    super(message);
    this.name = 'BillingRequiredError';
  }
}

export class DowngradeRequiredError extends Error {
  readonly code = 'DOWNGRADE_REQUIRED';

  constructor(
    message = 'Choose which workspace and connections to keep on the Pro plan.'
  ) {
    super(message);
    this.name = 'DowngradeRequiredError';
  }
}

type AccountBillingRow = {
  id: string;
  plan_code: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
  billing_downgrade_completed_at: string | null;
};

const PAID_PLANS: PlanCode[] = ['pro', 'firm'];
const PAYMENT_REQUIRED_STATUSES = new Set([
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
]);

async function loadAccountBilling(
  accountId: string
): Promise<AccountBillingRow | null> {
  const admin = createSupabaseAdmin();
  const { data } = await core(admin)
    .from('accounts')
    .select(
      'id, plan_code, subscription_status, trial_ends_at, stripe_subscription_id, billing_downgrade_completed_at'
    )
    .eq('id', accountId)
    .maybeSingle();
  return data;
}

export async function getBillingAccess(
  accountId: string
): Promise<BillingAccess> {
  const account = await loadAccountBilling(accountId);
  if (!account) return 'active';

  const planCode = (account.plan_code ?? 'free') as PlanCode;
  if (!PAID_PLANS.includes(planCode)) {
    return 'active';
  }

  const status = account.subscription_status ?? 'trialing';

  if (status === 'active' || status === 'trialing') {
    if (
      status === 'trialing' &&
      !account.stripe_subscription_id &&
      account.trial_ends_at &&
      new Date(account.trial_ends_at).getTime() <= Date.now()
    ) {
      return 'trial_expired';
    }
    return 'active';
  }

  if (PAYMENT_REQUIRED_STATUSES.has(status)) {
    return 'payment_required';
  }

  return 'active';
}

export async function accountExceedsProLimits(
  accountId: string
): Promise<boolean> {
  const admin = createSupabaseAdmin();

  const { count: workspaceCount } = await core(admin)
    .from('workspaces')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId);

  if ((workspaceCount ?? 0) > 1) return true;

  const { data: workspaces } = await core(admin)
    .from('workspaces')
    .select('id')
    .eq('account_id', accountId);

  for (const ws of workspaces ?? []) {
    const { count: stripeCount } = await core(admin)
      .from('stripe_connections')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', ws.id)
      .eq('is_active', true);
    if ((stripeCount ?? 0) > 1) return true;

    const { count: xeroCount } = await core(admin)
      .from('xero_connections')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', ws.id)
      .eq('is_active', true);
    if ((xeroCount ?? 0) > 1) return true;
  }

  return false;
}

export async function needsDowngradeSelection(
  accountId: string
): Promise<boolean> {
  const account = await loadAccountBilling(accountId);
  if (!account) return false;

  if ((account.plan_code as PlanCode) !== 'pro') return false;
  if (account.subscription_status !== 'active') return false;
  if (account.billing_downgrade_completed_at) return false;

  return accountExceedsProLimits(accountId);
}

export async function requireBillingAccess(accountId: string): Promise<void> {
  const access = await getBillingAccess(accountId);
  if (access === 'trial_expired') {
    throw new BillingRequiredError(
      'Your trial has ended. Subscribe to continue using Silkview Connect.'
    );
  }
  if (access === 'payment_required') {
    throw new BillingRequiredError(
      'Your subscription is inactive. Update billing to continue.'
    );
  }
}

export async function requireProductAccess(accountId: string): Promise<void> {
  await requireBillingAccess(accountId);
  if (await needsDowngradeSelection(accountId)) {
    throw new DowngradeRequiredError();
  }
}

export function getBillingUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4003';
  return `${base}/dashboard/billing`;
}

export async function getBillingState(accountId: string): Promise<{
  billingAccess: BillingAccess;
  needsDowngradeSelection: boolean;
  billingUrl: string;
  hasStripeCustomer: boolean;
}> {
  const admin = createSupabaseAdmin();
  const { data: account } = await core(admin)
    .from('accounts')
    .select('stripe_customer_id')
    .eq('id', accountId)
    .maybeSingle();

  const [billingAccess, downgradeNeeded] = await Promise.all([
    getBillingAccess(accountId),
    needsDowngradeSelection(accountId),
  ]);

  return {
    billingAccess,
    needsDowngradeSelection: downgradeNeeded,
    billingUrl: getBillingUrl(),
    hasStripeCustomer: !!account?.stripe_customer_id,
  };
}
