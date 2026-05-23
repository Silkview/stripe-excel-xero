import { getAppBaseUrl } from './app-url';

type OAuthProvider = 'xero' | 'stripe';

const CALLBACK_PATHS: Record<OAuthProvider, string> = {
  xero: '/api/xero/callback',
  stripe: '/api/stripe/callback',
};

const ENV_KEYS: Record<OAuthProvider, string> = {
  xero: 'XERO_REDIRECT_URI',
  stripe: 'STRIPE_REDIRECT_URI',
};

function canonicalRedirectUri(provider: OAuthProvider): string {
  return `${getAppBaseUrl()}${CALLBACK_PATHS[provider]}`;
}

function isValidConfiguredUri(
  configured: string,
  provider: OAuthProvider,
  base: string
): boolean {
  try {
    const url = new URL(configured);
    const expected = new URL(base);
    if (url.pathname !== CALLBACK_PATHS[provider]) return false;
    if (url.protocol !== expected.protocol) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * OAuth callback URL; must match Stripe Connect / Xero app settings exactly.
 * Prefer NEXT_PUBLIC_APP_URL + /api/{provider}/callback.
 * Legacy env values with wrong path or protocol are ignored.
 */
export function getOAuthRedirectUri(provider: OAuthProvider): string {
  const canonical = canonicalRedirectUri(provider);
  const base = getAppBaseUrl();
  const fromEnv = process.env[ENV_KEYS[provider]]?.trim();

  if (fromEnv && isValidConfiguredUri(fromEnv, provider, base)) {
    return fromEnv.replace(/\/$/, '');
  }

  if (fromEnv) {
    console.warn(
      `[oauth] Ignoring ${ENV_KEYS[provider]}="${fromEnv}" — expected ${canonical}. ` +
        `Register ${canonical} in your ${provider === 'xero' ? 'Xero' : 'Stripe Connect'} app.`
    );
  }

  return canonical;
}

export function getOAuthRedirectUris(): {
  appBaseUrl: string;
  stripe: string;
  xero: string;
  stripeEnv: string | null;
  xeroEnv: string | null;
} {
  return {
    appBaseUrl: getAppBaseUrl(),
    stripe: getOAuthRedirectUri('stripe'),
    xero: getOAuthRedirectUri('xero'),
    stripeEnv: process.env.STRIPE_REDIRECT_URI?.trim() ?? null,
    xeroEnv: process.env.XERO_REDIRECT_URI?.trim() ?? null,
  };
}
