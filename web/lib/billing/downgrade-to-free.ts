import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { recordBillingEvent, type BillingEventSource } from './record-event';

export type DowngradeReason =
  | 'trial_expired'
  | 'past_due_30d'
  | 'user_cancel';

const REASON_SOURCE: Record<DowngradeReason, BillingEventSource> = {
  trial_expired: 'cron',
  past_due_30d: 'cron',
  user_cancel: 'user_cancel',
};

/**
 * Reset an account back to the Free plan after trial expiry, prolonged
 * payment failure, or explicit user cancellation. Leaves connections and
 * workspaces intact — existing ProDowngradeWizard flow handles the cleanup
 * if the user is over Free-plan limits.
 */
export async function downgradeAccountToFree(
  accountId: string,
  reason: DowngradeReason
): Promise<void> {
  const admin = createSupabaseAdmin();

  const { error } = await core(admin)
    .from('accounts')
    .update({
      plan_code: 'free',
      plan: 'free',
      subscription_status: 'active',
      stripe_subscription_id: null,
      max_users: 1,
      max_workspaces: 1,
      trial_ends_at: null,
      past_due_since: null,
      billing_downgrade_completed_at: null,
      billing_interval: null,
    })
    .eq('id', accountId);
  if (error) {
    throw new Error(`accounts update failed: ${error.message}`);
  }

  await recordBillingEvent({
    source: REASON_SOURCE[reason],
    eventType: `auto_downgrade.${reason}`,
    accountId,
    status: 'processed',
  });
}
