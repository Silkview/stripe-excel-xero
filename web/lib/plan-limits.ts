import { createSupabaseAdmin } from './supabase/admin';
import { core } from './supabase/core';
import type { PlanCode } from './plans/types';
import { getBillingAccess } from './billing/access';

export type LimitResource = 'user' | 'workspace' | 'stripe' | 'xero';

export async function enforceLimit(
  accountId: string,
  resource: LimitResource,
  workspaceId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createSupabaseAdmin();
  const { data: account } = await core(supabase)
    .from('accounts')
    .select(
      'plan_code, plan, subscription_status, max_users, max_workspaces'
    )
    .eq('id', accountId)
    .single();

  if (!account) return { allowed: false, reason: 'Account not found' };

  const billingAccess = await getBillingAccess(accountId);
  if (billingAccess !== 'active') {
    return {
      allowed: false,
      reason:
        billingAccess === 'trial_expired'
          ? 'Your trial has ended. Subscribe to continue.'
          : 'Subscription inactive. Please update billing.',
    };
  }

  if (
    account.subscription_status === 'past_due' ||
    account.subscription_status === 'canceled'
  ) {
    return {
      allowed: false,
      reason: 'Subscription inactive. Please update billing.',
    };
  }

  if ((resource === 'xero' || resource === 'stripe') && !workspaceId) {
    return { allowed: false, reason: 'Workspace is required.' };
  }

  const { data: allowed, error: rpcError } = await core(supabase).rpc(
    'check_plan_limit',
    {
      p_account_id: accountId,
      p_resource: resource,
      p_workspace_id: workspaceId ?? undefined,
    }
  );

  if (rpcError) {
    console.error('check_plan_limit rpc:', rpcError);
    return { allowed: false, reason: 'Could not verify plan limits.' };
  }

  if (!allowed) {
    const planCode = (account.plan_code ?? account.plan ?? 'free') as PlanCode;
    const { data: plan } = await core(supabase)
      .from('plans')
      .select('*')
      .eq('code', planCode)
      .maybeSingle();

    const label =
      resource === 'user'
        ? `user${(plan?.max_users ?? 1) === 1 ? '' : 's'}`
        : resource === 'workspace'
          ? `workspace${(plan?.max_workspaces ?? 1) === 1 ? '' : 's'}`
          : resource === 'stripe'
            ? `Stripe account${(plan?.max_stripe_connections_per_workspace ?? 1) === 1 ? '' : 's'} per workspace`
            : `Xero organisation${(plan?.max_xero_connections_per_workspace ?? 1) === 1 ? '' : 's'} per workspace`;

    const cap =
      resource === 'user'
        ? plan?.max_users
        : resource === 'workspace'
          ? plan?.max_workspaces
          : resource === 'stripe'
            ? plan?.max_stripe_connections_per_workspace
            : plan?.max_xero_connections_per_workspace;

    const accountCap =
      resource === 'stripe' ? plan?.max_stripe_connections : null;

    const reason =
      resource === 'stripe' && accountCap != null
        ? `Your ${planCode} plan allows ${cap} Stripe account${(cap ?? 1) === 1 ? '' : 's'} per workspace (${accountCap} total across the account). Upgrade to increase limits.`
        : `Your ${planCode} plan allows ${cap} ${label}. Upgrade to increase limits.`;

    return {
      allowed: false,
      reason,
    };
  }

  return { allowed: true };
}

export async function enforceStripeConnect(
  accountId: string,
  workspaceId: string,
  stripeAccountId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createSupabaseAdmin();
  if (stripeAccountId) {
    const { data: existing } = await core(supabase)
      .from('stripe_connections')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('stripe_account_id', stripeAccountId)
      .eq('is_active', true)
      .maybeSingle();
    if (existing) {
      return { allowed: true };
    }
  }
  return enforceLimit(accountId, 'stripe', workspaceId);
}

/** Allow reconnect/replace when this workspace already has an active Xero slot. */
export async function enforceXeroConnect(
  accountId: string,
  workspaceId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createSupabaseAdmin();
  const { data: account } = await core(supabase)
    .from('accounts')
    .select('plan_code')
    .eq('id', accountId)
    .maybeSingle();

  const planCode = (account?.plan_code ?? 'free') as PlanCode;
  if (planCode === 'free') {
    return {
      allowed: false,
      reason: 'Upgrade to Pro or Firm to connect Xero.',
    };
  }

  const { data: existing } = await core(supabase)
    .from('xero_connections')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .maybeSingle();
  if (existing) {
    return { allowed: true };
  }
  return enforceLimit(accountId, 'xero', workspaceId);
}
