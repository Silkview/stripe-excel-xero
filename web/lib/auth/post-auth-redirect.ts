import type { SupabaseClient } from '@supabase/supabase-js';
import { getMfaStatus } from './mfa';
import {
  mfaEnrollPath,
  needsMfaEnrollmentSetup,
} from './mfa-enrollment';
import { getOnboardingStatusForUser } from './onboarding-status';
import { acceptPendingInviteForSession } from './accept-pending-invite-server';
import { safeReturnPath } from './client-post-auth-redirect';

export type PostAuthRedirectOptions = {
  excelMode?: boolean;
  returnPath?: string | null;
};

function mfaPathWithReturn(
  basePath: string,
  returnPath: string | null
): string {
  if (!returnPath) return basePath;
  const sep = basePath.includes('?') ? '&' : '?';
  return `${basePath}${sep}return=${encodeURIComponent(returnPath)}`;
}

export async function getPostAuthRedirectPath(
  supabase: SupabaseClient,
  options?: PostAuthRedirectOptions
): Promise<string> {
  const excelMode = options?.excelMode ?? false;
  const returnPath = safeReturnPath(options?.returnPath ?? null);

  await acceptPendingInviteForSession(supabase, returnPath);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const onboarding = await getOnboardingStatusForUser(
      user.id,
      user.user_metadata as Record<string, unknown>
    );
    if (onboarding.needsOnboarding) {
      return excelMode ? '/onboarding?return=excel' : '/onboarding';
    }
  }

  const status = await getMfaStatus(supabase);

  if (status.needsVerification) {
    const base = excelMode ? '/auth/mfa/verify?return=excel' : '/auth/mfa/verify';
    return mfaPathWithReturn(base, returnPath);
  }

  if (await needsMfaEnrollmentSetup(supabase)) {
    const base = mfaEnrollPath(excelMode);
    return mfaPathWithReturn(base, returnPath);
  }

  if (excelMode) {
    return '/api/auth/excel-finish';
  }

  return returnPath ?? '/dashboard';
}
