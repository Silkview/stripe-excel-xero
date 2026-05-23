import type { SupabaseClient } from '@supabase/supabase-js';
import { getMfaStatus } from './mfa';
import {
  mfaEnrollPath,
  needsMfaEnrollmentSetup,
} from './mfa-enrollment';

export type PostAuthRedirectOptions = {
  excelMode?: boolean;
  /** Internal path after auth gates (e.g. /auth/invite?token=…) */
  returnPath?: string | null;
};

/** Allow only same-origin relative paths. */
export function safeReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

/**
 * Client-side post-auth routing (mirrors server getPostAuthRedirectPath).
 * Onboarding (workspace provision) before MFA; connections gated in Excel.
 */
export async function resolvePostAuthRedirect(
  supabase: SupabaseClient,
  options?: PostAuthRedirectOptions
): Promise<string> {
  const excelMode = options?.excelMode ?? false;

  const res = await fetch('/api/onboarding/status', { credentials: 'include' });
  const json = await res.json().catch(() => null);

  if (json?.success && json.data?.needsOnboarding) {
    return excelMode ? '/onboarding?return=excel' : '/onboarding';
  }

  const mfa = await getMfaStatus(supabase);

  if (mfa.needsVerification) {
    return excelMode ? '/auth/mfa/verify?return=excel' : '/auth/mfa/verify';
  }

  if (await needsMfaEnrollmentSetup(supabase)) {
    return mfaEnrollPath(excelMode);
  }

  const returnPath = safeReturnPath(options?.returnPath ?? null);
  if (returnPath) return returnPath;

  return excelMode ? '/auth/excel-complete' : '/dashboard';
}
