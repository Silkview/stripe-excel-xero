import { requireWorkspace } from '@/lib/api-auth';
import {
  newNonce,
  setPkceVerifier,
  signOAuthState,
  type OAuthStatePayload,
} from '@/lib/oauth-state';
import { generatePkcePair } from '@/lib/pkce';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { user, workspaceId } = await requireWorkspace(request);
    const clientId = process.env.XERO_CLIENT_ID;
    const redirectUri =
      process.env.XERO_REDIRECT_URI ||
      'http://localhost:4003/api/xero/callback';

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
    return ok(request, { url, workspaceId });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
