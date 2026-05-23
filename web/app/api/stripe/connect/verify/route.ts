import {
  getStripeConnectClientId,
  getStripePlatformAccount,
  getStripePlatformSecretKey,
  isStripeConnectApiEnabled,
} from '@/lib/stripe-connect-config';
import { getOAuthRedirectUri } from '@/lib/oauth-redirect';
import { handleOptions, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

/** Dev helper: confirms platform secret key works and is paired with STRIPE_CLIENT_ID. */
export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const clientId = getStripeConnectClientId();
    const secret = getStripePlatformSecretKey();
    const redirectUri = getOAuthRedirectUri('stripe');

    const probe = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: secret,
        code: 'ac_config_probe_invalid',
        redirect_uri: redirectUri,
      }),
    });
    const body = (await probe.json()) as {
      error?: string;
      error_description?: string;
    };

    const paired =
      body.error === 'invalid_grant' &&
      (body.error_description?.includes('does not exist') ?? false);

    const balanceRes = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const balance = (await balanceRes.json()) as { livemode?: boolean };

    const platform = await getStripePlatformAccount();
    const connectApiEnabled = await isStripeConnectApiEnabled();

    return ok(request, {
      paired,
      platformAccountId: platform.id,
      platformEmail: platform.email,
      connectApiEnabled,
      secretMode: secret.startsWith('sk_test_')
        ? 'test'
        : secret.startsWith('sk_live_')
          ? 'live'
          : 'unknown',
      apiLivemode: balance.livemode ?? null,
      clientIdSuffix: clientId.slice(-8),
      redirectUri,
      hint: paired
        ? 'Connect Stripe via OAuth (GET /api/stripe/connect?flow=login). Users choose their own Stripe account.'
        : 'Copy STRIPE_CLIENT_ID with Test mode ON in Stripe Dashboard (Connect → OAuth).',
    });
  } catch (err) {
    return withCors(
      request,
      jsonError(
        'CONFIG_ERROR',
        err instanceof Error ? err.message : 'Stripe Connect config invalid.',
        503
      )
    );
  }
}
