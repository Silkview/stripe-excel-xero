import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';

const TTL_MS = 3 * 60 * 1000;

export async function saveExcelAuthHandoff(
  nonce: string,
  accessToken: string
): Promise<void> {
  const admin = createSupabaseAdmin();
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  await core(admin)
    .from('excel_auth_handoffs')
    .upsert({ nonce, access_token: accessToken, expires_at: expiresAt });
}

export async function takeExcelAuthHandoff(
  nonce: string
): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const { data, error } = await core(admin)
    .from('excel_auth_handoffs')
    .select('access_token, expires_at')
    .eq('nonce', nonce)
    .maybeSingle();

  await core(admin).from('excel_auth_handoffs').delete().eq('nonce', nonce);

  if (error || !data?.access_token) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data.access_token;
}
