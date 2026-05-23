import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { getPlanByCode } from '@/lib/plans/catalog';
import type { PlanCode } from '@/lib/plans/types';
import { getPrimaryAccountMembership } from './account-membership';

export type OnboardingPrefill = {
  planCode: PlanCode | null;
  accountName: string | null;
  workspaceName: string | null;
};

export type OnboardingStatus = {
  needsAccountSetup: boolean;
  needsConnectionSetup: boolean;
  needsOnboarding: boolean;
  planCode: PlanCode | null;
  accountId: string | null;
  workspaceId: string | null;
  hasXero: boolean;
  hasStripe: boolean;
  limits: {
    maxUsers: number;
    maxWorkspaces: number;
    maxStripeConnections: number;
    maxStripeConnectionsPerWorkspace: number;
    maxXeroConnectionsPerWorkspace: number;
  } | null;
  workspaceStripeCount: number;
  prefill?: OnboardingPrefill;
};

const VALID_PLANS: PlanCode[] = ['free', 'pro', 'firm'];

function planFromMeta(raw: unknown): PlanCode | null {
  if (typeof raw === 'string' && VALID_PLANS.includes(raw as PlanCode)) {
    return raw as PlanCode;
  }
  return null;
}

export function prefillFromUserMetadata(
  metadata: Record<string, unknown> | undefined
): OnboardingPrefill {
  if (!metadata) {
    return { planCode: null, accountName: null, workspaceName: null };
  }
  return {
    planCode: planFromMeta(metadata.plan_code),
    accountName:
      typeof metadata.account_name === 'string'
        ? metadata.account_name.trim() || null
        : null,
    workspaceName:
      typeof metadata.workspace_name === 'string'
        ? metadata.workspace_name.trim() || null
        : null,
  };
}

export async function getOnboardingStatusForUser(
  userId: string,
  userMetadata?: Record<string, unknown>,
  preferredWorkspaceId?: string | null
): Promise<OnboardingStatus> {
  const prefill = prefillFromUserMetadata(userMetadata);
  const admin = createSupabaseAdmin();

  const membership = await getPrimaryAccountMembership(userId, admin);

  if (!membership?.account_id) {
    return {
      needsAccountSetup: true,
      needsConnectionSetup: false,
      needsOnboarding: true,
      planCode: prefill.planCode,
      accountId: null,
      workspaceId: null,
      hasXero: false,
      hasStripe: false,
      limits: null,
      workspaceStripeCount: 0,
      prefill,
    };
  }

  const { data: account } = await core(admin)
    .from('accounts')
    .select(
      'id, plan_code, onboarding_completed_at, max_users, max_workspaces'
    )
    .eq('id', membership.account_id)
    .single();

  const planCode = (account?.plan_code ?? 'free') as PlanCode;
  const plan = await getPlanByCode(planCode);

  const { data: workspaces } = await core(admin)
    .from('workspaces')
    .select('id')
    .eq('account_id', membership.account_id)
    .order('created_at', { ascending: true });

  const workspaceIds = (workspaces ?? []).map((w) => w.id);
  let workspaceId: string | null = workspaces?.[0]?.id ?? null;
  if (
    preferredWorkspaceId &&
    workspaceIds.includes(preferredWorkspaceId)
  ) {
    workspaceId = preferredWorkspaceId;
  }

  let hasXero = false;
  let hasStripe = false;
  let workspaceStripeCount = 0;

  if (workspaceId) {
    const { data: xero } = await core(admin)
      .from('xero_connections')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .maybeSingle();
    hasXero = !!xero;

    const { count: stripeCount } = await core(admin)
      .from('stripe_connections')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);
    workspaceStripeCount = stripeCount ?? 0;
    hasStripe = workspaceStripeCount > 0;
  }

  const needsAccountSetup = !workspaceId;
  const needsConnectionSetup =
    !needsAccountSetup && (!hasXero || !hasStripe);
  /** Web redirect: workspace provision only (connections optional on web). */
  const needsOnboarding =
    needsAccountSetup || !account?.onboarding_completed_at;

  return {
    needsAccountSetup,
    needsConnectionSetup,
    needsOnboarding,
    planCode,
    accountId: membership.account_id,
    workspaceId,
    hasXero,
    hasStripe,
    limits: plan
      ? {
          maxUsers: plan.max_users,
          maxWorkspaces: plan.max_workspaces,
          maxStripeConnections: plan.max_stripe_connections,
          maxStripeConnectionsPerWorkspace:
            plan.max_stripe_connections_per_workspace,
          maxXeroConnectionsPerWorkspace:
            plan.max_xero_connections_per_workspace,
        }
      : null,
    workspaceStripeCount,
    prefill,
  };
}

export async function countAccountStripeConnections(
  accountId: string
): Promise<number> {
  const admin = createSupabaseAdmin();
  const { data: workspaces } = await core(admin)
    .from('workspaces')
    .select('id')
    .eq('account_id', accountId);

  if (!workspaces?.length) return 0;

  const ids = workspaces.map((w) => w.id);
  const { count } = await core(admin)
    .from('stripe_connections')
    .select('id', { count: 'exact', head: true })
    .in('workspace_id', ids)
    .eq('is_active', true);

  return count ?? 0;
}
