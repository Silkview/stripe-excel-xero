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

export function getStripeSecretKeyMode(): 'test' | 'live' | 'unknown' {
  const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? '';
  if (secret.startsWith('sk_test_')) return 'test';
  if (secret.startsWith('sk_live_')) return 'live';
  return 'unknown';
}

/**
 * Confirms STRIPE_CLIENT_ID and STRIPE_SECRET_KEY belong to the same Stripe platform.
 * Uses Stripe's token endpoint with a dummy code (invalid_grant + "does not exist" = paired).
 */
export async function verifyStripeConnectClientPaired(
  redirectUri: string
): Promise<{ paired: boolean; hint: string }> {
  const clientId = getStripeConnectClientId();
  const secret = getStripePlatformSecretKey();

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

  if (paired) {
    const mode = getStripeSecretKeyMode();
    let modeAligned = true;
    if (mode === 'test' || mode === 'live') {
      const balanceRes = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const balance = (await balanceRes.json()) as { livemode?: boolean };
      const expectLive = mode === 'live';
      if (balance.livemode !== undefined && balance.livemode !== expectLive) {
        modeAligned = false;
      }
    }

    if (!modeAligned) {
      return {
        paired: false,
        hint:
          'STRIPE_SECRET_KEY mode does not match the Stripe account mode. Use sk_test_… with Test mode ON in the Dashboard, or sk_live_… with Test mode OFF, and copy STRIPE_CLIENT_ID from that same mode.',
      };
    }

    return {
      paired: true,
      hint:
        mode === 'unknown'
          ? 'Stripe Connect credentials look paired.'
          : `Stripe Connect credentials are paired (${mode} mode). Users must authorize in the same ${mode} mode in the Stripe login screen.`,
    };
  }

  return {
    paired: false,
    hint:
      'STRIPE_CLIENT_ID and STRIPE_SECRET_KEY are not from the same Stripe account or mode. In the Stripe Dashboard, turn Test mode ON or OFF, then copy both the Connect client ID (ca_…) and secret key (sk_test_… or sk_live_…) from that same mode. Redeploy the web app after updating Vercel env vars.',
  };
}

/** Dev-only escape hatch; never used for OAuth callback fallback. */
export function isPlatformSelfConnectAllowed(): boolean {
  return process.env.STRIPE_ALLOW_PLATFORM_SELF_CONNECT === 'true';
}

export function formatStripeConnectConfigError(
  message: string,
  context?: { redirectUri?: string }
): string {
  const lower = message.toLowerCase();

  if (
    lower.includes('does not belong to you') ||
    lower.includes('authorization code provided does not belong')
  ) {
    const mode = getStripeSecretKeyMode();
    const modeHint =
      mode === 'test' || mode === 'live'
        ? ` Your server is using ${mode} keys (sk_${mode}_…); complete Stripe login in ${mode} mode.`
        : '';
    const redirectHint = context?.redirectUri
      ? ` Callback URL must be registered exactly as: ${context.redirectUri}`
      : '';
    return (
      'Stripe could not complete Connect sign-in (configuration or expired link).' +
      modeHint +
      ' Ensure STRIPE_CLIENT_ID and STRIPE_SECRET_KEY are from the same Stripe account with Test mode matching the user login.' +
      redirectHint +
      ' Then click Connect Stripe again (authorization codes are single-use and expire in 5 minutes).'
    );
  }

  if (message.includes('redirect_uri')) {
    return (
      `${message} Register the exact callback URL in Stripe Dashboard → Settings → Connect → Redirects.`
    );
  }

  return message;
}
