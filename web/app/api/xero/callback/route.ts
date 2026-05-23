import { saveXeroConnection } from '@/lib/connections/store';
import { enforceLimit } from '@/lib/plan-limits';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { getAppBaseUrl } from '@/lib/app-url';
import {
  deletePkceVerifier,
  getPkceVerifier,
  signXeroTenantPick,
  verifyOAuthState,
} from '@/lib/oauth-state';
import {
  authCallbackErrorHtml,
  authCallbackHtml,
} from '@/lib/api-response';
import {
  exchangeXeroCode,
  fetchXeroConnections,
  getOrganisationBaseCurrency,
} from '@/lib/services/xero';
import { NextResponse } from 'next/server';

async function saveXeroTenantForWorkspace(
  workspaceId: string,
  userId: string,
  tokenResponse: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  },
  tenant: { tenantId: string; tenantName: string }
): Promise<void> {
  const baseCurrency = await getOrganisationBaseCurrency(
    tokenResponse.access_token,
    tenant.tenantId
  );

  const admin = createSupabaseAdmin();
  const { data: ws } = await core(admin)
    .from('workspaces')
    .select('account_id')
    .eq('id', workspaceId)
    .single();

  if (ws?.account_id) {
    const check = await enforceLimit(ws.account_id, 'xero', workspaceId);
    if (!check.allowed) {
      throw new Error(check.reason ?? 'Plan limit reached.');
    }
  }

  await saveXeroConnection(
    workspaceId,
    {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: Date.now() + tokenResponse.expires_in * 1000,
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      baseCurrency,
    },
    userId
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const error_description = url.searchParams.get('error_description');
  const state = url.searchParams.get('state');

  if (error) {
    return new NextResponse(
      authCallbackErrorHtml('xero', error_description || error),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  if (!code) {
    return new NextResponse(
      authCallbackErrorHtml('xero', 'No authorization code received.'),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const payload = state ? verifyOAuthState(state) : null;
  if (!payload || !state) {
    return new NextResponse(
      authCallbackErrorHtml('xero', 'Invalid or expired OAuth state.'),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const codeVerifier = payload.codeVerifier ?? getPkceVerifier(state);
  if (!codeVerifier) {
    return new NextResponse(
      authCallbackErrorHtml(
        'xero',
        'Session expired. Please try connecting again.'
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  try {
    const tokenResponse = await exchangeXeroCode(code, codeVerifier);
    deletePkceVerifier(state);

    const connections = await fetchXeroConnections(tokenResponse.access_token);
    if (connections.length === 0) {
      return new NextResponse(
        authCallbackErrorHtml('xero', 'No Xero organisation found.'),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    if (connections.length > 1) {
      const pick = signXeroTenantPick({
        workspaceId: payload.workspaceId,
        userId: payload.userId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        tenants: connections.map((c) => ({
          tenantId: c.tenantId,
          tenantName: c.tenantName,
        })),
      });
      const chooseUrl = `${getAppBaseUrl()}/auth/xero/choose-org?pick=${encodeURIComponent(pick)}`;
      return NextResponse.redirect(chooseUrl);
    }

    const tenant = connections[0];
    await saveXeroTenantForWorkspace(
      payload.workspaceId,
      payload.userId,
      tokenResponse,
      tenant
    );

    return new NextResponse(
      authCallbackHtml({
        status: 'xero_connected',
        tenantName: tenant.tenantName,
      }),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to connect Xero.';
    return new NextResponse(authCallbackErrorHtml('xero', message), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
