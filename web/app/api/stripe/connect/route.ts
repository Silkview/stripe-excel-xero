import { requireWorkspace } from '@/lib/api-auth';
import {
  newNonce,
  signOAuthState,
  type OAuthStatePayload,
} from '@/lib/oauth-state';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { user, workspaceId } = await requireWorkspace(request);
    const clientId = process.env.STRIPE_CLIENT_ID;
    const redirectUri =
      process.env.STRIPE_REDIRECT_URI ||
      'http://localhost:4003/api/stripe/callback';

    if (!clientId) {
      return withCors(
        request,
        jsonError(
          'CONFIG_ERROR',
          'Stripe Connect is not configured.',
          503
        )
      );
    }

    const payload: OAuthStatePayload = {
      workspaceId,
      userId: user.id,
      nonce: newNonce(),
    };
    const state = signOAuthState(payload);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: 'read_write',
      redirect_uri: redirectUri,
      state,
    });

    const url = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
    return ok(request, { url, workspaceId });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
