import type { Database } from '@/types/database.types';
import { createSupabaseAdmin } from '../supabase/admin';
import { core } from '../supabase/core';
import { decrypt, encrypt } from '../encrypt';

type XeroInsert = Database['core']['Tables']['xero_connections']['Insert'];
type StripeInsert = Database['core']['Tables']['stripe_connections']['Insert'];

export interface StripeTokens {
  access_token: string;
  stripe_user_id: string;
}

export interface XeroTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  tenantId: string;
  tenantName: string;
  baseCurrency?: string;
  scopes?: string[];
}

export type XeroConnectionStatus =
  | 'connected'
  | 'reconnect_required'
  | 'disconnected';

export type XeroConnectionMeta = {
  status: XeroConnectionStatus;
  tenantName: string | null;
  tenantId: string | null;
  refreshFailedAt: string | null;
  refreshErrorCode: string | null;
  lastRefreshedAt: string | null;
};

export type StripeConnectionRow = {
  id: string;
  stripe_account_id: string;
  display_name: string | null;
  workspace_id: string;
  is_default?: boolean;
};

export async function listStripeConnections(
  workspaceId: string
): Promise<StripeConnectionRow[]> {
  const admin = createSupabaseAdmin();
  const { data } = await core(admin)
    .from('stripe_connections')
    .select('id, stripe_account_id, display_name, workspace_id, is_default')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('connected_at', { ascending: true });

  return (data ?? []) as StripeConnectionRow[];
}

export async function listStripeConnectionsForAccount(
  accountId: string
): Promise<StripeConnectionRow[]> {
  const admin = createSupabaseAdmin();
  const { data: workspaces } = await core(admin)
    .from('workspaces')
    .select('id')
    .eq('account_id', accountId);

  if (!workspaces?.length) return [];

  const ids = workspaces.map((w) => w.id);
  const { data } = await core(admin)
    .from('stripe_connections')
    .select('id, stripe_account_id, display_name, workspace_id, is_default')
    .in('workspace_id', ids)
    .eq('is_active', true)
    .order('connected_at', { ascending: true });

  return (data ?? []) as StripeConnectionRow[];
}

export async function getStripeConnection(
  workspaceId: string,
  stripeAccountId?: string | null
): Promise<StripeTokens | undefined> {
  const admin = createSupabaseAdmin();
  let query = core(admin)
    .from('stripe_connections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true);

  if (stripeAccountId) {
    query = query.eq('stripe_account_id', stripeAccountId);
  } else {
    query = query
      .order('is_default', { ascending: false })
      .order('connected_at', { ascending: false })
      .limit(1);
  }

  const { data } = await query.maybeSingle();

  if (!data) return undefined;
  return {
    access_token: decrypt(data.access_token_encrypted),
    stripe_user_id: data.stripe_account_id,
  };
}

export async function setDefaultStripeConnection(
  workspaceId: string,
  stripeAccountId: string
): Promise<void> {
  const admin = createSupabaseAdmin();
  await core(admin)
    .from('stripe_connections')
    .update({ is_default: false })
    .eq('workspace_id', workspaceId)
    .eq('is_active', true);

  await core(admin)
    .from('stripe_connections')
    .update({ is_default: true })
    .eq('workspace_id', workspaceId)
    .eq('stripe_account_id', stripeAccountId)
    .eq('is_active', true);
}

export async function saveStripeConnection(
  workspaceId: string,
  tokens: StripeTokens,
  userId?: string,
  options?: {
    scope?: string;
    displayName?: string;
    setAsDefault?: boolean;
  }
): Promise<void> {
  const admin = createSupabaseAdmin();

  const { count } = await core(admin)
    .from('stripe_connections')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('is_active', true);

  const isFirst = (count ?? 0) === 0;
  const makeDefault = options?.setAsDefault ?? isFirst;

  if (makeDefault) {
    await core(admin)
      .from('stripe_connections')
      .update({ is_default: false })
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);
  }

  const stripeRow: StripeInsert = {
    workspace_id: workspaceId,
    stripe_account_id: tokens.stripe_user_id,
    display_name: options?.displayName ?? tokens.stripe_user_id,
    access_token_encrypted: encrypt(tokens.access_token),
    scope: options?.scope ?? 'read_write',
    connected_by: userId ?? null,
    is_active: true,
    is_default: makeDefault,
  };
  const { error } = await core(admin)
    .from('stripe_connections')
    .upsert(stripeRow, { onConflict: 'workspace_id,stripe_account_id' });

  if (error) {
    console.error('saveStripeConnection:', error);
    throw new Error(error.message);
  }
}

export async function getXeroConnection(
  workspaceId: string
): Promise<XeroTokens | undefined> {
  const admin = createSupabaseAdmin();
  const { data } = await core(admin)
    .from('xero_connections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) return undefined;
  return rowToXeroTokens(data);
}

export async function getXeroConnectionMeta(
  workspaceId: string
): Promise<XeroConnectionMeta> {
  const admin = createSupabaseAdmin();
  const { data } = await core(admin)
    .from('xero_connections')
    .select(
      'tenant_id, tenant_name, refresh_failed_at, refresh_error_code, last_refreshed_at, is_active'
    )
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (!data || !data.is_active) {
    return {
      status: 'disconnected',
      tenantName: null,
      tenantId: null,
      refreshFailedAt: null,
      refreshErrorCode: null,
      lastRefreshedAt: null,
    };
  }

  if (data.refresh_failed_at || data.refresh_error_code) {
    return {
      status: 'reconnect_required',
      tenantName: data.tenant_name,
      tenantId: data.tenant_id,
      refreshFailedAt: data.refresh_failed_at,
      refreshErrorCode: data.refresh_error_code,
      lastRefreshedAt: data.last_refreshed_at,
    };
  }

  return {
    status: 'connected',
    tenantName: data.tenant_name,
    tenantId: data.tenant_id,
    refreshFailedAt: null,
    refreshErrorCode: null,
    lastRefreshedAt: data.last_refreshed_at,
  };
}

function rowToXeroTokens(data: {
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string;
  tenant_id: string;
  tenant_name: string | null;
  base_currency: string | null;
  scopes?: string[] | null;
}): XeroTokens {
  return {
    access_token: decrypt(data.access_token_encrypted),
    refresh_token: decrypt(data.refresh_token_encrypted),
    expires_at: new Date(data.token_expires_at).getTime(),
    tenantId: data.tenant_id,
    tenantName: data.tenant_name ?? '',
    baseCurrency: data.base_currency ?? undefined,
    scopes: data.scopes ?? undefined,
  };
}

export async function markXeroRefreshFailure(
  workspaceId: string,
  errorCode: string
): Promise<void> {
  const admin = createSupabaseAdmin();
  await core(admin)
    .from('xero_connections')
    .update({
      refresh_failed_at: new Date().toISOString(),
      refresh_error_code: errorCode,
    })
    .eq('workspace_id', workspaceId)
    .eq('is_active', true);
}

export async function clearXeroRefreshFailure(workspaceId: string): Promise<void> {
  const admin = createSupabaseAdmin();
  await core(admin)
    .from('xero_connections')
    .update({
      refresh_failed_at: null,
      refresh_error_code: null,
    })
    .eq('workspace_id', workspaceId)
    .eq('is_active', true);
}

export async function saveXeroConnection(
  workspaceId: string,
  tokens: XeroTokens,
  userId?: string,
  options?: { scopes?: string[] }
): Promise<void> {
  const admin = createSupabaseAdmin();
  const row: XeroInsert = {
    workspace_id: workspaceId,
    tenant_id: tokens.tenantId,
    tenant_name: tokens.tenantName,
    base_currency: tokens.baseCurrency ?? null,
    access_token_encrypted: encrypt(tokens.access_token),
    refresh_token_encrypted: encrypt(tokens.refresh_token),
    token_expires_at: new Date(tokens.expires_at).toISOString(),
    connected_by: userId ?? null,
    last_refreshed_at: new Date().toISOString(),
    is_active: true,
    refresh_failed_at: null,
    refresh_error_code: null,
    scopes: options?.scopes ?? tokens.scopes ?? null,
  };
  const { error } = await core(admin).from('xero_connections').upsert(row, {
    onConflict: 'workspace_id',
  });

  if (error) {
    console.error('saveXeroConnection:', error);
    throw new Error(error.message);
  }
}

export async function disconnectStripeConnection(
  workspaceId: string,
  options?: { connectionId?: string; stripeAccountId?: string }
): Promise<void> {
  const admin = createSupabaseAdmin();
  let query = core(admin)
    .from('stripe_connections')
    .update({ is_active: false, is_default: false })
    .eq('workspace_id', workspaceId);

  if (options?.connectionId) {
    query = query.eq('id', options.connectionId);
  } else if (options?.stripeAccountId) {
    query = query.eq('stripe_account_id', options.stripeAccountId);
  } else {
    await disconnectStripeForWorkspace(workspaceId);
    return;
  }

  await query;

  const { data: remaining } = await core(admin)
    .from('stripe_connections')
    .select('stripe_account_id')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('connected_at', { ascending: true })
    .limit(1);

  if (remaining?.length) {
    await setDefaultStripeConnection(workspaceId, remaining[0].stripe_account_id);
  }
}

export async function disconnectStripeForWorkspace(
  workspaceId: string
): Promise<void> {
  const admin = createSupabaseAdmin();
  await core(admin)
    .from('stripe_connections')
    .update({ is_active: false, is_default: false })
    .eq('workspace_id', workspaceId);
}

export async function disconnectXeroForWorkspace(
  workspaceId: string
): Promise<void> {
  const admin = createSupabaseAdmin();
  await core(admin)
    .from('xero_connections')
    .update({ is_active: false })
    .eq('workspace_id', workspaceId);
}
