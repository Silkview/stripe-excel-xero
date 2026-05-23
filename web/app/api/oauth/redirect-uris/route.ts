import { NextResponse } from 'next/server';
import { getOAuthRedirectUris } from '@/lib/oauth-redirect';

/** Public diagnostic: which callback URLs this deployment uses for Stripe/Xero OAuth. */
export async function GET() {
  const uris = getOAuthRedirectUris();
  return NextResponse.json({
    success: true,
    data: {
      ...uris,
      registerInStripeConnect: uris.stripe,
      registerInXeroDeveloper: uris.xero,
      notes: [
        'Paths must be /api/stripe/callback and /api/xero/callback (not /auth/xero or /api/auth/xero).',
        'Use https and the same host as NEXT_PUBLIC_APP_URL (recommended: https://www.silkview.org).',
        'STRIPE_REDIRECT_URI and XERO_REDIRECT_URI are optional if NEXT_PUBLIC_APP_URL is set correctly.',
      ],
    },
  });
}
