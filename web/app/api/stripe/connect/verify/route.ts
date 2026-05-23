import {
  getStripeConnectClientId,
  getStripePlatformAccount,
  getStripePlatformSecretKey,
  getStripeSecretKeyMode,
  isStripeConnectApiEnabled,
  verifyStripeConnectClientPaired,
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

    const { paired, hint: pairingHint } =
      await verifyStripeConnectClientPaired(redirectUri);

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
      secretMode: getStripeSecretKeyMode(),
      apiLivemode: balance.livemode ?? null,
      clientIdSuffix: clientId.slice(-8),
      redirectUri,
      hint: paired
        ? pairingHint
        : pairingHint,
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
