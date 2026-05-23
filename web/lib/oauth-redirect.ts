type OAuthProvider = 'xero' | 'stripe';

const CALLBACK_PATHS: Record<OAuthProvider, string> = {
  xero: '/api/xero/callback',
  stripe: '/api/stripe/callback',
};

const ENV_KEYS: Record<OAuthProvider, string> = {
  xero: 'XERO_REDIRECT_URI',
  stripe: 'STRIPE_REDIRECT_URI',
};

/**
 * Canonical OAuth callback URL; must match provider app settings exactly.
 * Defaults to NEXT_PUBLIC_APP_URL (dev server is http://localhost:4003, not https).
 */
export function getOAuthRedirectUri(provider: OAuthProvider): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4003'
  ).replace(/\/$/, '');

  const envKey = ENV_KEYS[provider];
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) {
    try {
      const configured = new URL(fromEnv);
      const app = new URL(base);
      if (configured.protocol !== app.protocol) {
        return `${base}${CALLBACK_PATHS[provider]}`;
      }
    } catch {
      return fromEnv;
    }
    return fromEnv;
  }

  return `${base}${CALLBACK_PATHS[provider]}`;
}
