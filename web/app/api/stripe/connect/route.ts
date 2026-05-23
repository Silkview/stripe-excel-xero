import { requireWorkspace, getAccountMembership } from '@/lib/api-auth';
import { enforceStripeConnect } from '@/lib/plan-limits';
import {
  newNonce,
  signOAuthState,
  type OAuthStatePayload,
} from '@/lib/oauth-state';
import { getOAuthRedirectUri } from '@/lib/oauth-redirect';
import { buildStripeAuthorizeUrl } from '@/lib/stripe-authorize-url';
import { getStripeConnectClientId } from '@/lib/stripe-connect-config';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { user, workspaceId } = await requireWorkspace(request);
    const url = new URL(request.url);
    // Default: sign in to an existing Stripe account (Standard Connect OAuth).
    // Use flow=register only when explicitly creating a new connected account.
    const flow = url.searchParams.get('flow') === 'register' ? 'register' : 'login';
    const membership = await getAccountMembership(user.id);
    if (!membership) {
      return withCors(request, jsonError('ACCOUNT_REQUIRED', 'No account.', 403));
    }
    const check = await enforceStripeConnect(membership.account_id, workspaceId);
    if (!check.allowed) {
      return withCors(
        request,
        jsonError('PLAN_LIMIT', check.reason ?? 'Plan limit reached.', 403)
      );
    }

    let clientId: string;
    try {
      clientId = getStripeConnectClientId();
    } catch (err) {
      return withCors(
        request,
        jsonError(
          'CONFIG_ERROR',
          err instanceof Error ? err.message : 'Stripe Connect is not configured.',
          503
        )
      );
    }
    const redirectUri = getOAuthRedirectUri('stripe');

    const payload: OAuthStatePayload = {
      workspaceId,
      userId: user.id,
      nonce: newNonce(),
      stripeClientId: clientId,
      stripeRedirectUri: redirectUri,
      stripeConnectFlow: flow,
    };
    const state = signOAuthState(payload);

    const authorizeUrl = buildStripeAuthorizeUrl({
      clientId,
      redirectUri,
      state,
      flow,
    });

    return ok(request, {
      url: authorizeUrl,
      workspaceId,
      redirectUri,
      flow,
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
