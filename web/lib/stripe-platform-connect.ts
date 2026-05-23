import { saveStripeConnection } from './connections/store';
import {
  getStripePlatformAccount,
  getStripePlatformSecretKey,
} from './stripe-connect-config';

/** Link the workspace to the platform Stripe account (no Connect OAuth). */
export async function connectPlatformStripeAccount(
  workspaceId: string,
  userId: string
): Promise<{ stripeAccountId: string; displayName: string }> {
  const platform = await getStripePlatformAccount();
  if (!platform.id) {
    throw new Error('Could not read your Stripe platform account. Check STRIPE_SECRET_KEY.');
  }

  const secret = getStripePlatformSecretKey();
  const displayName =
    platform.email ?? platform.id;

  await saveStripeConnection(
    workspaceId,
    {
      access_token: secret,
      stripe_user_id: platform.id,
    },
    userId,
    { scope: 'platform_self', displayName }
  );

  return { stripeAccountId: platform.id, displayName };
}
