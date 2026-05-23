import { listStripeConnections } from '@/lib/connections/store';
import { getPrimaryAccountMembership } from '@/lib/auth/account-membership';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import type { WorkspaceSummary } from './types';

export async function listWorkspacesForUser(
  userId: string
): Promise<WorkspaceSummary[]> {
  const membership = await getPrimaryAccountMembership(userId);
  if (!membership) return [];

  const admin = createSupabaseAdmin();
  const isAdmin =
    membership.role === 'owner' || membership.role === 'admin';

  let workspaceIds: string[] | null = null;

  if (!isAdmin) {
    const { data: au } = await core(admin)
      .from('account_users')
      .select('id')
      .eq('user_id', userId)
      .eq('account_id', membership.account_id)
      .maybeSingle();

    if (!au?.id) return [];

    const { data: scoped } = await core(admin)
      .from('account_user_workspaces')
      .select('workspace_id')
      .eq('account_user_id', au.id);

    workspaceIds = (scoped ?? []).map((r) => r.workspace_id);
    if (!workspaceIds.length) return [];
  }

  let query = core(admin)
    .from('workspaces')
    .select('id, name, created_at')
    .eq('account_id', membership.account_id)
    .order('created_at', { ascending: true });

  if (workspaceIds) {
    query = query.in('id', workspaceIds);
  }

  const { data: workspaces } = await query;
  if (!workspaces?.length) return [];

  const summaries: WorkspaceSummary[] = [];

  for (const ws of workspaces) {
    const { data: xero } = await core(admin)
      .from('xero_connections')
      .select('tenant_name, token_expires_at')
      .eq('workspace_id', ws.id)
      .eq('is_active', true)
      .maybeSingle();

    let tokenExpiring = false;
    if (xero?.token_expires_at) {
      const expires = new Date(xero.token_expires_at).getTime();
      tokenExpiring = expires - Date.now() < 7 * 86400000;
    }

    const stripe = await listStripeConnections(ws.id);

    summaries.push({
      id: ws.id,
      name: ws.name,
      created_at: ws.created_at ?? new Date().toISOString(),
      xero: xero
        ? {
            connected: true,
            tenant_name: xero.tenant_name,
            token_expiring: tokenExpiring,
          }
        : null,
      stripe: stripe.map((s) => ({
        id: s.id,
        stripe_account_id: s.stripe_account_id,
        display_name: s.display_name,
      })),
    });
  }

  return summaries;
}
