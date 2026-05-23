import { requireWorkspace, getAccountMembership } from '@/lib/api-auth';
import { enforceLimit } from '@/lib/plan-limits';
import {
  newNonce,
  setPkceVerifier,
  signOAuthState,
  type OAuthStatePayload,
} from '@/lib/oauth-state';
import { generatePkcePair } from '@/lib/pkce';
import { getOAuthRedirectUri } from '@/lib/oauth-redirect';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { user, workspaceId } = await requireWorkspace(request);
    const membership = await getAccountMembership(user.id);
    if (!membership) {
      return withCors(request, jsonError('ACCOUNT_REQUIRED', 'No account.', 403));
    }
    const check = await enforceLimit(membership.account_id, 'xero', workspaceId);
    if (!check.allowed) {
      return withCors(
        request,
        jsonError('PLAN_LIMIT', check.reason ?? 'Plan limit reached.', 403)
      );
    }

    const clientId = process.env.XERO_CLIENT_ID;
    const redirectUri = getOAuthRedirectUri('xero');

    if (!clientId) {
      return withCors(
        request,
        jsonError('CONFIG_ERROR', 'Xero is not configured.', 503)
      );
    }

    const { codeVerifier, codeChallenge } = generatePkcePair();
    const payload: OAuthStatePayload = {
      workspaceId,
      userId: user.id,
      nonce: newNonce(),
      codeVerifier,
    };
    const state = signOAuthState(payload);
    setPkceVerifier(state, codeVerifier);

    const scopes = [
      'accounting.transactions',
      'accounting.settings',
      'accounting.reports.read',
      'offline_access',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const url = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;

    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'xero/connect/route.ts',message:'xero authorize url built',data:{redirectUri,hasClientId:!!clientId},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    return ok(request, { url, workspaceId, redirectUri });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
