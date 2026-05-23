import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { assertCoreApiSchema } from '@/lib/supabase/assert-core-api';
import { core } from '@/lib/supabase/core';
import { getPlanByCode } from '@/lib/plans/catalog';
import { getFallbackPlanByCode } from '@/lib/plans/fallback';
import type { PlanCode } from '@/lib/plans/types';
import { syncAccountPlanFromSelection } from './apply-account-plan';
import {
  deleteOrphanAccount,
  findWorkspaceByNameForAccount,
  getPrimaryAccountMembership,
  getPrimaryWorkspaceForAccount,
  isUniqueViolation,
  markOnboardingCompletedIfNull,
} from './account-membership';

export type ProvisionAccountInput = {
  userId: string;
  email: string;
  planCode: PlanCode;
  accountName: string;
  workspaceName: string;
};

export type ProvisionAccountResult = {
  accountId: string;
  workspaceId: string;
  created: boolean;
};

async function acquireProvisionLock(userId: string): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { error } = await core(supabase).rpc('lock_user_provisioning', {
    p_user_id: userId,
  });
  if (error) {
    console.warn('provisionAccount: lock_user_provisioning unavailable', error.message);
  }
}

async function releaseProvisionLock(userId: string): Promise<void> {
  const supabase = createSupabaseAdmin();
  const { error } = await core(supabase).rpc('unlock_user_provisioning', {
    p_user_id: userId,
  });
  if (error) {
    console.warn('provisionAccount: unlock_user_provisioning unavailable', error.message);
  }
}

async function returnExistingMembership(
  accountId: string,
  workspaceName: string,
  planCode: PlanCode
): Promise<ProvisionAccountResult> {
  const supabase = createSupabaseAdmin();
  await syncAccountPlanFromSelection(accountId, planCode);

  let ws =
    (await findWorkspaceByNameForAccount(accountId, workspaceName, supabase)) ??
    (await getPrimaryWorkspaceForAccount(accountId, supabase));

  if (!ws) {
    throw new Error('Account exists but has no workspace. Contact support.');
  }

  await markOnboardingCompletedIfNull(accountId, supabase);

  return {
    accountId,
    workspaceId: ws.id,
    created: false,
  };
}

async function createAccountAndWorkspace(
  input: ProvisionAccountInput
): Promise<ProvisionAccountResult> {
  const plan =
    (await getPlanByCode(input.planCode)) ??
    getFallbackPlanByCode(input.planCode);
  if (!plan) {
    throw new Error(
      `Plan catalog not loaded (${input.planCode}). Apply migration 002_plans_and_onboarding.`
    );
  }

  const supabase = createSupabaseAdmin();
  const subscriptionStatus =
    input.planCode === 'free' ? 'active' : 'trialing';

  const { data: account, error: accErr } = await core(supabase)
    .from('accounts')
    .insert({
      name: input.accountName,
      plan_code: input.planCode,
      plan: input.planCode === 'free' ? 'trialing' : input.planCode,
      subscription_status: subscriptionStatus,
      max_users: plan.max_users,
      max_workspaces: plan.max_workspaces,
      trial_ends_at:
        input.planCode === 'free'
          ? null
          : new Date(Date.now() + 14 * 86400000).toISOString(),
    })
    .select('id')
    .single();

  if (accErr || !account) {
    throw new Error(accErr?.message ?? 'Failed to create account.');
  }

  const { error: memberErr } = await core(supabase).from('account_users').insert({
    account_id: account.id,
    user_id: input.userId,
    role: 'owner',
  });

  if (memberErr) {
    if (isUniqueViolation(memberErr)) {
      await deleteOrphanAccount(account.id, supabase);
      const existing = await getPrimaryAccountMembership(input.userId, supabase);
      if (existing) {
        return returnExistingMembership(
          existing.account_id,
          input.workspaceName,
          input.planCode
        );
      }
    }
    throw new Error(memberErr.message ?? 'Failed to link account to user.');
  }

  const { data: workspace, error: wsErr } = await core(supabase)
    .from('workspaces')
    .insert({
      account_id: account.id,
      name: input.workspaceName,
      created_by: input.userId,
    })
    .select('id')
    .single();

  if (wsErr || !workspace) {
    if (isUniqueViolation(wsErr)) {
      const existingWs = await findWorkspaceByNameForAccount(
        account.id,
        input.workspaceName,
        supabase
      );
      if (existingWs) {
        await markOnboardingCompletedIfNull(account.id, supabase);
        return {
          accountId: account.id,
          workspaceId: existingWs.id,
          created: false,
        };
      }
    }
    throw new Error(wsErr?.message ?? 'Failed to create workspace.');
  }

  await core(supabase)
    .from('accounts')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', account.id);

  return {
    accountId: account.id,
    workspaceId: workspace.id,
    created: true,
  };
}

export async function provisionAccount(
  input: ProvisionAccountInput
): Promise<ProvisionAccountResult> {
  await assertCoreApiSchema();

  const accountName = input.accountName.trim();
  const workspaceName = input.workspaceName.trim();
  if (!accountName) {
    throw new Error('Account name is required.');
  }
  if (!workspaceName) {
    throw new Error('Workspace name is required.');
  }

  const normalizedInput = { ...input, accountName, workspaceName };

  await acquireProvisionLock(input.userId);
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const supabase = createSupabaseAdmin();
      const existing = await getPrimaryAccountMembership(
        input.userId,
        supabase
      );
      if (existing) {
        return returnExistingMembership(
          existing.account_id,
          workspaceName,
          input.planCode
        );
      }

      try {
        return await createAccountAndWorkspace(normalizedInput);
      } catch (err) {
        const pgErr = err as { code?: string };
        if (isUniqueViolation(pgErr) && attempt < 2) {
          continue;
        }
        const afterRace = await getPrimaryAccountMembership(
          input.userId,
          supabase
        );
        if (afterRace) {
          return returnExistingMembership(
            afterRace.account_id,
            workspaceName,
            input.planCode
          );
        }
        throw err;
      }
    }

    const supabase = createSupabaseAdmin();
    const final = await getPrimaryAccountMembership(input.userId, supabase);
    if (final) {
      return returnExistingMembership(
        final.account_id,
        workspaceName,
        input.planCode
      );
    }
    throw new Error('Failed to provision account after retries.');
  } finally {
    await releaseProvisionLock(input.userId);
  }
}
