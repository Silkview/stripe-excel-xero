import type { SupabaseClient } from '@supabase/supabase-js';
import { getMfaStatus } from './mfa';
import {
  mfaEnrollPath,
  needsMfaEnrollmentSetup,
} from './mfa-enrollment';
import { getOnboardingStatusForUser } from './onboarding-status';

export type PostAuthRedirectOptions = {
  excelMode?: boolean;
};

export async function getPostAuthRedirectPath(
  supabase: SupabaseClient,
  options?: PostAuthRedirectOptions
): Promise<string> {
  const excelMode = options?.excelMode ?? false;

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
    return excelMode ? '/auth/mfa/verify?return=excel' : '/auth/mfa/verify';
  }

  if (await needsMfaEnrollmentSetup(supabase)) {
    return mfaEnrollPath(excelMode);
  }

  if (excelMode) {
    return '/api/auth/excel-finish';
  }

  return '/dashboard';
}
