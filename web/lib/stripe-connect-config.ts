/**
 * Stripe Connect OAuth uses the platform secret key + Connect client ID
 * from the SAME Stripe account (Dashboard → Developers → API keys + Connect → Settings).
 */
export function getStripeConnectClientId(): string {
  const id = process.env.STRIPE_CLIENT_ID?.trim();
  if (!id) {
    throw new Error(
      'Missing STRIPE_CLIENT_ID. Copy the Connect client ID (ca_…) from Stripe Dashboard → Settings → Connect → OAuth.'
    );
  }
  if (!id.startsWith('ca_')) {
    throw new Error(
      'STRIPE_CLIENT_ID must be a Connect client ID (starts with ca_), not a publishable or secret API key.'
    );
  }
  return id;
}

export function getStripePlatformSecretKey(): string {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error(
      'Missing STRIPE_SECRET_KEY. Use the secret key from the same Stripe account as STRIPE_CLIENT_ID.'
    );
  }
  if (!secret.startsWith('sk_')) {
    throw new Error(
      'STRIPE_SECRET_KEY must be a secret key (sk_test_… or sk_live_…), not a restricted key or webhook secret.'
    );
  }
  return secret;
}

export async function getStripePlatformAccount(): Promise<{
  id: string | null;
  email: string | null;
}> {
  try {
    const secret = getStripePlatformSecretKey();
    const res = await fetch('https://api.stripe.com/v1/account', {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!res.ok) return { id: null, email: null };
    const data = (await res.json()) as { id?: string; email?: string };
    return { id: data.id ?? null, email: data.email ?? null };
  } catch {
    return { id: null, email: null };
  }
}

export async function getStripePlatformAccountId(): Promise<string | null> {
  const { id } = await getStripePlatformAccount();
  return id;
}

/** False when the platform has not finished Connect signup in the Dashboard. */
export async function isStripeConnectApiEnabled(): Promise<boolean> {
  try {
    const secret = getStripePlatformSecretKey();
    const res = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ type: 'standard', country: 'US' }),
    });
    const body = (await res.json()) as { error?: { message?: string } };
    return !body.error?.message?.includes('signed up for Connect');
  } catch {
    return false;
  }
}

export function formatStripeConnectConfigError(
  message: string,
  _context?: { platformAccountId?: string | null }
): string {
  if (message.includes('does not belong to you')) {
    return (
      'That Stripe account is the same one that owns this Connect application, so it cannot be linked as a connected account. ' +
      'When Stripe asks you to sign in, choose the client business Stripe account you want to sync (or sign out of Stripe first and sign in with a different account).'
    );
  }
  if (message.includes('redirect_uri')) {
    return (
      `${message} Register the exact callback URL in Stripe Dashboard → Settings → Connect → Redirects.`
    );
  }
  return message;
}
