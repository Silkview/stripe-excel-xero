import {
  getXeroConnectionMeta,
  listStripeConnections,
} from '@/lib/connections/store';
import { getPrimaryAccountMembership } from '@/lib/auth/account-membership';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import type { ManualJournalPostMode } from '@stripesync/shared';
import type { WorkspaceSummary } from './types';

function parseManualJournalPostMode(value: string | null | undefined): ManualJournalPostMode {
  return value === 'draft_only' ? 'draft_only' : 'draft_and_post';
}

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
    .select('id, name, created_at, manual_journal_post_mode')
    .eq('account_id', membership.account_id)
    .order('created_at', { ascending: true });

  if (workspaceIds) {
    query = query.in('id', workspaceIds);
  }

  const { data: workspaces } = await query;
  if (!workspaces?.length) return [];

  const summaries: WorkspaceSummary[] = [];

  for (const ws of workspaces) {
    const xeroMeta = await getXeroConnectionMeta(ws.id);
    const staleRefreshMs = 50 * 86400000;
    const staleRefresh =
      xeroMeta.status === 'connected' &&
      !!xeroMeta.lastRefreshedAt &&
      Date.now() - new Date(xeroMeta.lastRefreshedAt).getTime() > staleRefreshMs;

    const stripe = await listStripeConnections(ws.id);

    summaries.push({
      id: ws.id,
      name: ws.name,
      created_at: ws.created_at ?? new Date().toISOString(),
      manualJournalPostMode: parseManualJournalPostMode(ws.manual_journal_post_mode),
      xero:
        xeroMeta.status !== 'disconnected'
          ? {
              connected: xeroMeta.status === 'connected',
              status: xeroMeta.status,
              tenant_name: xeroMeta.tenantName,
              stale_refresh: staleRefresh,
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
