import type { SupabaseClient } from '@supabase/supabase-js';
import { getMfaStatus } from './mfa';

export async function getPostAuthRedirectPath(
  supabase: SupabaseClient
): Promise<string> {
  const status = await getMfaStatus(supabase);

  if (status.needsVerification) {
    return '/auth/mfa/verify';
  }

  if (!status.hasVerifiedTotp) {
    return '/auth/mfa/enroll';
  }

  return '/dashboard';
}
