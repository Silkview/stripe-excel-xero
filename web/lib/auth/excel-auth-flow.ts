import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApiResponse } from '@stripesync/shared';
import { resolvePostAuthRedirect } from './client-post-auth-redirect';

export type EnsureAccountResult = {
  accountId: string;
  created: boolean;
  needsOnboarding?: boolean;
};

export async function ensureAccountProvisioned(
  accessToken?: string
): Promise<EnsureAccountResult | null> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch('/api/auth/ensure-account', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: '{}',
  });

  const body = (await res.json().catch(() => null)) as ApiResponse<
    EnsureAccountResult & { needsOnboarding?: boolean }
  > | null;

  if (body?.error?.code === 'ONBOARDING_REQUIRED') {
    return { accountId: '', created: false, needsOnboarding: true };
  }

  if (!res.ok || !body?.success || !body.data) {
    return null;
  }

  return body.data;
}

/** Where to navigate after password login or MFA verify in the Excel dialog. */
export async function getExcelPostLoginPath(
  supabase: SupabaseClient
): Promise<string> {
  return resolvePostAuthRedirect(supabase, { excelMode: true });
}
