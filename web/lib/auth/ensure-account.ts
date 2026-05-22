import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';

export async function ensureAccountForUser(
  userId: string,
  email: string,
  accountName?: string
): Promise<{ accountId: string; created: boolean }> {
  const supabase = createSupabaseAdmin();

  const { data: existing } = await core(supabase)
    .from('account_users')
    .select('account_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.account_id) {
    return { accountId: existing.account_id, created: false };
  }

  const { data: account, error: accErr } = await core(supabase)
    .from('accounts')
    .insert({
      name: accountName || `${email.split('@')[0]}'s account`,
    })
    .select('id')
    .single();

  if (accErr || !account) {
    throw new Error(accErr?.message ?? 'Failed to create account.');
  }

  await core(supabase).from('account_users').insert({
    account_id: account.id,
    user_id: userId,
    role: 'owner',
  });

  await core(supabase).from('workspaces').insert({
    account_id: account.id,
    name: 'Default workspace',
    created_by: userId,
  });

  return { accountId: account.id, created: true };
}
