import type { SupabaseClient } from '@supabase/supabase-js';
import { getMfaStatus } from './mfa';

export function userSkippedMfaEnroll(
  metadata: Record<string, unknown> | undefined
): boolean {
  return metadata?.mfa_enroll_skipped === true;
}

/** User should see MFA enrollment (QR + code) with option to skip. */
export async function needsMfaEnrollmentSetup(
  supabase: SupabaseClient
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const status = await getMfaStatus(supabase);

  if (status.hasVerifiedTotp || status.needsVerification) {
    return false;
  }

  if (userSkippedMfaEnroll(user?.user_metadata as Record<string, unknown>)) {
    return false;
  }

  return true;
}

export async function markMfaEnrollmentSkipped(
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { mfa_enroll_skipped: true },
  });
  if (error) throw error;
}

export function mfaEnrollPath(excelMode?: boolean): string {
  return excelMode ? '/auth/excel?step=mfa' : '/auth/mfa/enroll';
}
