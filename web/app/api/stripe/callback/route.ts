import { saveStripeConnection } from '@/lib/connections/store';
import { enforceStripeConnect } from '@/lib/plan-limits';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { verifyOAuthState } from '@/lib/oauth-state';
import {
  authCallbackErrorHtml,
  authCallbackHtml,
} from '@/lib/api-response';
import {
  formatStripeConnectConfigError,
  getStripePlatformAccountId,
} from '@/lib/stripe-connect-config';
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
    const admin = createSupabaseAdmin();
    const { data: ws } = await core(admin)
      .from('workspaces')
      .select('account_id')
      .eq('id', payload.workspaceId)
      .single();

    if (!payload.stripeClientId || !payload.stripeRedirectUri) {
      return new NextResponse(
        authCallbackErrorHtml(
          'stripe',
          'OAuth session is outdated. Close this tab, return to Excel, and click Connect Stripe again.'
        ),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const tokens = await exchangeStripeCode(code, {
      clientId: payload.stripeClientId,
      redirectUri: payload.stripeRedirectUri,
    });

    if (!tokens.stripe_user_id || !tokens.access_token) {
      throw new Error('Stripe did not return account credentials. Try connecting again.');
    }

    if (ws?.account_id) {
      const check = await enforceStripeConnect(
        ws.account_id,
        payload.workspaceId,
        tokens.stripe_user_id
      );
      if (!check.allowed) {
        return new NextResponse(authCallbackErrorHtml('stripe', check.reason!), {
          headers: { 'Content-Type': 'text/html' },
        });
      }
    }

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
    const raw = err instanceof Error ? err.message : 'Failed to connect Stripe.';
    const platformAccountId = await getStripePlatformAccountId();
    const message = formatStripeConnectConfigError(raw, { platformAccountId });
    return new NextResponse(authCallbackErrorHtml('stripe', message), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
