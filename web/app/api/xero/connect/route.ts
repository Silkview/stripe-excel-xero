import { requireWorkspace, getAccountMembership } from '@/lib/api-auth';
import { enforceXeroConnect } from '@/lib/plan-limits';
import {
  newNonce,
  setPkceVerifier,
  signOAuthState,
} from '@/lib/oauth-state';
import { generatePkcePair } from '@/lib/pkce';
import { getOAuthRedirectUri } from '@/lib/oauth-redirect';
import { xeroOAuthScopeString } from '@/lib/xero-scopes';
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
    const check = await enforceXeroConnect(membership.account_id, workspaceId);
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
    const payload = {
      workspaceId,
      userId: user.id,
      nonce: newNonce(),
      codeVerifier,
    };
    const state = signOAuthState(payload);
    setPkceVerifier(state, codeVerifier);

    const scopes = xeroOAuthScopeString();

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

    return ok(request, { url, workspaceId, redirectUri });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
