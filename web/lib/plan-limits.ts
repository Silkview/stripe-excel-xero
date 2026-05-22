import { createSupabaseAdmin } from './supabase/admin';
import { core } from './supabase/core';

export type PlanLimits = {
  maxUsers: number;
  maxWorkspaces: number;
};

const PLAN_LIMITS: Record<string, PlanLimits> = {
  trialing: { maxUsers: 1, maxWorkspaces: 1 },
  pro: { maxUsers: 1, maxWorkspaces: 1 },
  firm: { maxUsers: 5, maxWorkspaces: 5 },
  canceled: { maxUsers: 0, maxWorkspaces: 0 },
};

export async function enforceLimit(
  accountId: string,
  resource: 'user' | 'workspace'
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createSupabaseAdmin();
  const { data: account } = await core(supabase)
    .from('accounts')
    .select('plan, subscription_status, max_users, max_workspaces')
    .eq('id', accountId)
    .single();

  if (!account) return { allowed: false, reason: 'Account not found' };

  if (
    account.subscription_status === 'past_due' ||
    account.subscription_status === 'canceled'
  ) {
    return {
      allowed: false,
      reason: 'Subscription inactive. Please update billing.',
    };
  }

  const { data: allowed } = await core(supabase).rpc('check_plan_limit', {
    p_account_id: accountId,
    p_resource: resource,
  });

  if (!allowed) {
    const limits = PLAN_LIMITS[account.plan] ?? PLAN_LIMITS.trialing;
    const limit =
      resource === 'user' ? limits.maxUsers : limits.maxWorkspaces;
    return {
      allowed: false,
      reason: `Your ${account.plan} plan allows ${limit} ${resource}(s). Upgrade to Firm for up to 5.`,
    };
  }
  return { allowed: true };
}
