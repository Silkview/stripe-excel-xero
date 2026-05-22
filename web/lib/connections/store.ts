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
}

export async function getStripeConnection(
  workspaceId: string
): Promise<StripeTokens | undefined> {
  const admin = createSupabaseAdmin();
  const { data } = await core(admin)
    .from('stripe_connections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return undefined;
  return {
    access_token: decrypt(data.access_token_encrypted),
    stripe_user_id: data.stripe_account_id,
  };
}

export async function saveStripeConnection(
  workspaceId: string,
  tokens: StripeTokens,
  userId?: string
): Promise<void> {
  const admin = createSupabaseAdmin();
  const stripeRow: StripeInsert = {
    workspace_id: workspaceId,
    stripe_account_id: tokens.stripe_user_id,
    display_name: tokens.stripe_user_id,
    access_token_encrypted: encrypt(tokens.access_token),
    connected_by: userId ?? null,
    is_active: true,
  };
  await core(admin)
    .from('stripe_connections')
    .upsert(stripeRow, { onConflict: 'workspace_id,stripe_account_id' });
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
  return {
    access_token: decrypt(data.access_token_encrypted),
    refresh_token: decrypt(data.refresh_token_encrypted),
    expires_at: new Date(data.token_expires_at).getTime(),
    tenantId: data.tenant_id,
    tenantName: data.tenant_name ?? '',
    baseCurrency: data.base_currency ?? undefined,
  };
}

export async function saveXeroConnection(
  workspaceId: string,
  tokens: XeroTokens,
  userId?: string
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
  };
  await core(admin).from('xero_connections').upsert(row, {
    onConflict: 'workspace_id',
  });
}
