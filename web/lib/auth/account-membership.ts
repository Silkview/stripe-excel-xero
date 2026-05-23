import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';

export type AccountMembershipRow = {
  account_id: string;
  role: string;
};

export type WorkspaceRow = {
  id: string;
};

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

/** One membership per user; never use maybeSingle on user_id (breaks when duplicates exist). */
export async function getPrimaryAccountMembership(
  userId: string,
  client?: SupabaseClient
): Promise<AccountMembershipRow | null> {
  const supabase = client ?? createSupabaseAdmin();
  const { data, error } = await core(supabase)
    .from('account_users')
    .select('account_id, role')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('getPrimaryAccountMembership:', error);
    return null;
  }

  const row = data?.[0];
  if (!row?.account_id) return null;
  return { account_id: row.account_id, role: row.role };
}

/** Primary workspace for an account (oldest by created_at). */
export async function getPrimaryWorkspaceForAccount(
  accountId: string,
  client?: SupabaseClient
): Promise<WorkspaceRow | null> {
  const supabase = client ?? createSupabaseAdmin();
  const { data, error } = await core(supabase)
    .from('workspaces')
    .select('id')
    .eq('account_id', accountId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('getPrimaryWorkspaceForAccount:', error);
    return null;
  }

  const row = data?.[0];
  return row?.id ? { id: row.id } : null;
}

export async function findWorkspaceByNameForAccount(
  accountId: string,
  workspaceName: string,
  client?: SupabaseClient
): Promise<WorkspaceRow | null> {
  const supabase = client ?? createSupabaseAdmin();
  const normalized = workspaceName.trim().toLowerCase();
  const { data, error } = await core(supabase)
    .from('workspaces')
    .select('id, name')
    .eq('account_id', accountId);

  if (error) {
    console.error('findWorkspaceByNameForAccount:', error);
    return null;
  }

  const match = (data ?? []).find(
    (w) => (w.name as string).trim().toLowerCase() === normalized
  );
  return match?.id ? { id: match.id as string } : null;
}

export async function markOnboardingCompletedIfNull(
  accountId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createSupabaseAdmin();
  await core(supabase)
    .from('accounts')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', accountId)
    .is('onboarding_completed_at', null);
}

export async function deleteOrphanAccount(
  accountId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createSupabaseAdmin();
  const { count } = await core(supabase)
    .from('account_users')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', accountId);

  if (count === 0) {
    await core(supabase).from('accounts').delete().eq('id', accountId);
  }
}

export { isUniqueViolation };
