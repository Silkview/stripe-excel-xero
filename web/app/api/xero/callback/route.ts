import { saveXeroConnection } from '@/lib/connections/store';
import { enforceLimit } from '@/lib/plan-limits';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import {
  deletePkceVerifier,
  getPkceVerifier,
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  // #region agent log
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'xero/callback/route.ts:entry',message:'callback hit',data:{hasCode:!!url.searchParams.get('code'),hasError:!!url.searchParams.get('error')},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const error_description = url.searchParams.get('error_description');
  const state = url.searchParams.get('state');

  if (error) {
    return new NextResponse(
      authCallbackErrorHtml('xero', error_description || error),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code) {
    return new NextResponse(
      authCallbackErrorHtml('xero', 'No authorization code received.'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  const payload = state ? verifyOAuthState(state) : null;
  if (!payload || !state) {
    return new NextResponse(
      authCallbackErrorHtml('xero', 'Invalid or expired OAuth state.'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  const codeVerifier = payload.codeVerifier ?? getPkceVerifier(state);
  if (!codeVerifier) {
    return new NextResponse(
      authCallbackErrorHtml(
        'xero',
        'Session expired. Please try connecting again.'
      ),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const tokenResponse = await exchangeXeroCode(code, codeVerifier);
    deletePkceVerifier(state);

    const connections = await fetchXeroConnections(tokenResponse.access_token);
    if (connections.length === 0) {
      return new NextResponse(
        authCallbackErrorHtml('xero', 'No Xero organisation found.'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const tenant = connections[0];
    const baseCurrency = await getOrganisationBaseCurrency(
      tokenResponse.access_token,
      tenant.tenantId
    );

    const admin = createSupabaseAdmin();
    const { data: ws } = await core(admin)
      .from('workspaces')
      .select('account_id')
      .eq('id', payload.workspaceId)
      .single();

    if (ws?.account_id) {
      const check = await enforceLimit(
        ws.account_id,
        'xero',
        payload.workspaceId
      );
      if (!check.allowed) {
        return new NextResponse(authCallbackErrorHtml('xero', check.reason!), {
          headers: { 'Content-Type': 'text/html' },
        });
      }
    }

    await saveXeroConnection(
      payload.workspaceId,
      {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: Date.now() + tokenResponse.expires_in * 1000,
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        baseCurrency,
      },
      payload.userId
    );

    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'xero/callback/route.ts:success',message:'xero connected',data:{tenantName:tenant.tenantName},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

    return new NextResponse(
      authCallbackHtml({
        status: 'xero_connected',
        tenantName: tenant.tenantName,
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to connect Xero.';
    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'xero/callback/route.ts:error',message:'callback failed',data:{error:message.slice(0,120)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    return new NextResponse(authCallbackErrorHtml('xero', message), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
