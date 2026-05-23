import type { SupabaseClient } from '@supabase/supabase-js';
import { getMfaStatus } from './mfa';
import {
  mfaEnrollPath,
  needsMfaEnrollmentSetup,
} from './mfa-enrollment';
import {
  clearInviteTokenMetadata,
  resolveInviteToken,
  tryAcceptPendingInvite,
} from './pending-invite';
import { extractInviteTokenFromReturnPath } from './invite-token';

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

function mfaPathWithReturn(
  basePath: string,
  returnPath: string | null
): string {
  if (!returnPath) return basePath;
  const sep = basePath.includes('?') ? '&' : '?';
  return `${basePath}${sep}return=${encodeURIComponent(returnPath)}`;
}

/**
 * Client-side post-auth routing (mirrors server getPostAuthRedirectPath).
 * Pending invite acceptance before onboarding; MFA optional with skip.
 */
export async function resolvePostAuthRedirect(
  supabase: SupabaseClient,
  options?: PostAuthRedirectOptions
): Promise<string> {
  const excelMode = options?.excelMode ?? false;
  const returnPath = safeReturnPath(options?.returnPath ?? null);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const metadata = user?.user_metadata as Record<string, unknown> | undefined;

  const inviteToken = resolveInviteToken(returnPath, metadata);
  if (inviteToken) {
    await tryAcceptPendingInvite(inviteToken);
    await clearInviteTokenMetadata(supabase);
  }

  const res = await fetch('/api/onboarding/status', { credentials: 'include' });
  const json = await res.json().catch(() => null);

  if (json?.success && json.data?.needsOnboarding) {
    return excelMode ? '/onboarding?return=excel' : '/onboarding';
  }

  const mfa = await getMfaStatus(supabase);

  if (mfa.needsVerification) {
    const base = excelMode ? '/auth/mfa/verify?return=excel' : '/auth/mfa/verify';
    return mfaPathWithReturn(base, returnPath);
  }

  if (await needsMfaEnrollmentSetup(supabase)) {
    const base = mfaEnrollPath(excelMode);
    return mfaPathWithReturn(base, returnPath);
  }

  if (returnPath) {
    const stillInvite = extractInviteTokenFromReturnPath(returnPath);
    if (stillInvite) {
      return '/dashboard';
    }
    return returnPath;
  }

  return excelMode ? '/api/auth/excel-finish' : '/dashboard';
}
