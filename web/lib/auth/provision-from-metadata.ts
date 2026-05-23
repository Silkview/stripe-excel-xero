import type { User } from '@supabase/supabase-js';
import { provisionAccount } from './provision-account';
import { prefillFromUserMetadata } from './onboarding-status';
import type { PlanCode } from '@/lib/plans/types';

const VALID_PLANS: PlanCode[] = ['free', 'pro', 'firm'];

export type ResolvedProvisioningFields = {
  planCode: PlanCode;
  accountName: string;
  workspaceName: string;
};

export function resolveProvisioningFields(
  user: User,
  overrides?: Partial<{
    planCode: PlanCode;
    accountName: string;
    workspaceName: string;
  }>
): ResolvedProvisioningFields {
  const prefill = prefillFromUserMetadata(
    user.user_metadata as Record<string, unknown>
  );

  const planCode =
    overrides?.planCode ??
    prefill.planCode ??
    (VALID_PLANS.includes(user.user_metadata?.plan_code as PlanCode)
      ? (user.user_metadata.plan_code as PlanCode)
      : 'free');

  const emailLocal = user.email?.split('@')[0]?.trim() || 'My account';

  const accountName =
    overrides?.accountName?.trim() ||
    prefill.accountName ||
    emailLocal;

  const workspaceName =
    overrides?.workspaceName?.trim() ||
    prefill.workspaceName ||
    'Main workspace';

  return {
    planCode: VALID_PLANS.includes(planCode) ? planCode : 'free',
    accountName,
    workspaceName,
  };
}

export type ProvisionFromMetadataResult = {
  provisioned: boolean;
  created: boolean;
  accountId?: string;
  workspaceId?: string;
  error?: string;
};

export async function tryProvisionFromMetadata(
  user: User,
  overrides?: Partial<{
    planCode: PlanCode;
    accountName: string;
    workspaceName: string;
  }>
): Promise<ProvisionFromMetadataResult> {
  try {
    const fields = resolveProvisioningFields(user, overrides);
    const result = await provisionAccount({
      userId: user.id,
      email: user.email ?? '',
      planCode: fields.planCode,
      accountName: fields.accountName,
      workspaceName: fields.workspaceName,
    });

    return {
      provisioned: true,
      created: result.created,
      accountId: result.accountId,
      workspaceId: result.workspaceId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Provisioning failed.';
    console.error('tryProvisionFromMetadata:', message, err);
    return { provisioned: false, created: false, error: message };
  }
}
