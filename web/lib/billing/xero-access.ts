import type { PlanCode } from '@/lib/plans/types';
import type { BillingAccess } from './access';
import { getBillingAccess, getBillingUrl } from './access';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';

export class XeroUpgradeRequiredError extends Error {
  readonly code = 'XERO_UPGRADE_REQUIRED';

  constructor(
    message = 'Upgrade to Pro or Firm to connect Xero and push to your ledger.'
  ) {
    super(message);
    this.name = 'XeroUpgradeRequiredError';
  }
}

export function canUseXeroFeatures(
  planCode: PlanCode,
  billingAccess: BillingAccess
): boolean {
  return planCode !== 'free' && billingAccess === 'active';
}

export async function requireXeroFeatureAccess(
  accountId: string
): Promise<void> {
  const admin = createSupabaseAdmin();
  const { data: account } = await core(admin)
    .from('accounts')
    .select('plan_code')
    .eq('id', accountId)
    .maybeSingle();

  const planCode = (account?.plan_code ?? 'free') as PlanCode;
  const billingAccess = await getBillingAccess(accountId);

  if (!canUseXeroFeatures(planCode, billingAccess)) {
    if (planCode === 'free') {
      throw new XeroUpgradeRequiredError(
        'Upgrade to Pro or Firm to connect Xero and push to your ledger.'
      );
    }
    if (billingAccess === 'trial_expired') {
      throw new XeroUpgradeRequiredError(
        'Your trial has ended. Subscribe to continue using Xero features.'
      );
    }
    if (billingAccess === 'payment_required') {
      throw new XeroUpgradeRequiredError(
        'Your subscription is inactive. Update billing to use Xero features.'
      );
    }
    throw new XeroUpgradeRequiredError();
  }
}

export function getXeroUpgradeBillingUrl(): string {
  return getBillingUrl();
}
