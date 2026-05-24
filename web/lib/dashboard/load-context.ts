import { getPrimaryAccountMembership } from '@/lib/auth/account-membership';
import { countAccountStripeConnections } from '@/lib/auth/onboarding-status';
import { planDisplayName } from '@/lib/plans/display';
import type { PlanCode } from '@/lib/plans/types';
import { getPlanByCode } from '@/lib/plans/catalog';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { dashboardDebugLog } from '@/lib/dashboard-debug-log';
import type { DashboardContext } from './types';

function initialsFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || '?';
}

export async function loadDashboardContext(
  userId: string,
  email: string
): Promise<DashboardContext | null> {
  const membership = await getPrimaryAccountMembership(userId);
  if (!membership) return null;

  let admin;
  try {
    admin = createSupabaseAdmin();
  } catch (err) {
    dashboardDebugLog(
      'load-context.ts:admin',
      'createSupabaseAdmin failed',
      { error: err instanceof Error ? err.message : String(err) },
      'A'
    );
    throw err;
  }
  const { data: account } = await core(admin)
    .from('accounts')
    .select(
      'id, name, plan_code, subscription_status, trial_ends_at, max_users, max_workspaces'
    )
    .eq('id', membership.account_id)
    .single();

  if (!account) return null;

  const planCode = (account.plan_code ?? 'free') as PlanCode;
  const plan = await getPlanByCode(planCode);

  const { count: workspaceCount } = await core(admin)
    .from('workspaces')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', membership.account_id);

  const { count: userCount } = await core(admin)
    .from('account_users')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', membership.account_id);

  const { count: pendingInvites } = await core(admin)
    .from('account_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', membership.account_id)
    .is('accepted_at', null);

  const stripeConnectionCount = await countAccountStripeConnections(
    membership.account_id
  );

  const role = membership.role as DashboardContext['role'];
  const isAdmin = role === 'owner' || role === 'admin';

  return {
    email,
    displayName: email.split('@')[0] ?? email,
    initials: initialsFromEmail(email),
    role,
    isAdmin,
    accountId: membership.account_id,
    accountName: account.name,
    planCode,
    planLabel: planDisplayName(planCode),
    subscriptionStatus: account.subscription_status,
    trialEndsAt: account.trial_ends_at,
    limits: {
      maxWorkspaces: plan?.max_workspaces ?? account.max_workspaces,
      maxUsers: plan?.max_users ?? account.max_users,
      maxStripeConnections: plan?.max_stripe_connections ?? 1,
      maxStripeConnectionsPerWorkspace:
        plan?.max_stripe_connections_per_workspace ?? 1,
      workspaceCount: workspaceCount ?? 0,
      userCount: (userCount ?? 0) + (pendingInvites ?? 0),
      stripeConnectionCount,
    },
    workspaceCount: workspaceCount ?? 0,
  };
}
