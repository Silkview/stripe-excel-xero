import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { getPlanByCode } from '@/lib/plans/catalog';
import { getFallbackPlanByCode } from '@/lib/plans/fallback';
import type { PlanCode } from '@/lib/plans/types';

/**
 * Applies the plan chosen at signup/onboarding when reusing an existing account.
 * Skips accounts with an active paid Stripe subscription.
 */
export async function syncAccountPlanFromSelection(
  accountId: string,
  planCode: PlanCode
): Promise<void> {
  const supabase = createSupabaseAdmin();

  const { data: account, error } = await core(supabase)
    .from('accounts')
    .select('plan_code, subscription_status, stripe_subscription_id')
    .eq('id', accountId)
    .single();

  if (error || !account) {
    return;
  }

  if (
    account.stripe_subscription_id &&
    account.subscription_status === 'active'
  ) {
    return;
  }

  if (account.plan_code === planCode) {
    return;
  }

  const plan =
    (await getPlanByCode(planCode)) ?? getFallbackPlanByCode(planCode);
  if (!plan) {
    return;
  }

  const subscriptionStatus =
    planCode === 'free' ? 'active' : 'trialing';

  await core(supabase)
    .from('accounts')
    .update({
      plan_code: planCode,
      subscription_status: subscriptionStatus,
      max_users: plan.max_users,
      max_workspaces: plan.max_workspaces,
      trial_ends_at:
        planCode === 'free'
          ? null
          : new Date(Date.now() + 14 * 86400000).toISOString(),
    })
    .eq('id', accountId);
}
