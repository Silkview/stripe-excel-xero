import { saveStripeConnection } from '@/lib/connections/store';
import { verifyOAuthState } from '@/lib/oauth-state';
import {
  authCallbackErrorHtml,
  authCallbackHtml,
} from '@/lib/api-response';
import { exchangeStripeCode } from '@/lib/services/stripe-data';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const error_description = url.searchParams.get('error_description');
  const state = url.searchParams.get('state');

  if (error) {
    return new NextResponse(
      authCallbackErrorHtml(
        'stripe',
        error_description || error
      ),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code) {
    return new NextResponse(
      authCallbackErrorHtml('stripe', 'No authorization code received.'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  const payload = state ? verifyOAuthState(state) : null;
  if (!payload) {
    return new NextResponse(
      authCallbackErrorHtml('stripe', 'Invalid or expired OAuth state.'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const tokens = await exchangeStripeCode(code);
    await saveStripeConnection(
      payload.workspaceId,
      tokens,
      payload.userId
    );
    return new NextResponse(
      authCallbackHtml({
        status: 'stripe_connected',
        stripe_user_id: tokens.stripe_user_id,
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to connect Stripe.';
    return new NextResponse(authCallbackErrorHtml('stripe', message), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
