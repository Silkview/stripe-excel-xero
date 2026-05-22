import type { SupabaseClient } from '@supabase/supabase-js';
import { getMfaStatus } from './mfa';

export async function ensureAccountProvisioned(
  accessToken?: string
): Promise<void> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  await fetch('/api/auth/ensure-account', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: '{}',
  });
}

/** Where to navigate after password login or MFA verify in the Excel dialog. */
export async function getExcelPostLoginPath(
  supabase: SupabaseClient
): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  try {
    await ensureAccountProvisioned(session?.access_token);
  } catch {
    // Webhook may have provisioned; continue
  }

  const status = await getMfaStatus(supabase);
  if (status.needsVerification) {
    return '/auth/mfa/verify?return=excel';
  }

  return '/auth/excel-complete';
}
