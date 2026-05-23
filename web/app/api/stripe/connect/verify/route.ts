import {
  getStripeConnectClientId,
  getStripePlatformAccount,
  getStripePlatformSecretKey,
  getStripeSecretKeyMode,
  isStripeConnectApiEnabled,
  verifyStripeConnectClientPaired,
} from '@/lib/stripe-connect-config';
import { getOAuthRedirectUri } from '@/lib/oauth-redirect';
import { requireAccountAdmin } from '@/lib/api-auth';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { withCors } from '@/lib/cors';

/** Operator diagnostic: Stripe Connect env pairing (owners/admins only). */
export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    await requireAccountAdmin(request);

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
      connectApiEnabled,
      secretMode: getStripeSecretKeyMode(),
      apiLivemode: balance.livemode ?? null,
      clientIdSuffix: clientId.slice(-8),
      redirectUri,
      hint: pairingHint,
      note:
        'Customers connect their own Stripe accounts via OAuth. These values are for your Connect platform app only.',
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
