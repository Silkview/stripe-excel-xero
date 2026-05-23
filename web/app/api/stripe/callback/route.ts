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
  isStripePlatformSelfConnectError,
} from '@/lib/stripe-connect-config';
import { connectPlatformStripeAccount } from '@/lib/stripe-platform-connect';
import { exchangeStripeCode } from '@/lib/services/stripe-data';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  // #region agent log
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'stripe/callback/route.ts:entry',message:'callback hit',data:{hasCode:!!url.searchParams.get('code'),hasError:!!url.searchParams.get('error')},timestamp:Date.now(),hypothesisId:'S1'})}).catch(()=>{});
  // #endregion
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
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  if (!code) {
    return new NextResponse(
      authCallbackErrorHtml('stripe', 'No authorization code received.'),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const payload = state ? verifyOAuthState(state) : null;
  if (!payload) {
    return new NextResponse(
      authCallbackErrorHtml('stripe', 'Invalid or expired OAuth state.'),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const admin = createSupabaseAdmin();
  const { data: ws } = await core(admin)
    .from('workspaces')
    .select('account_id')
    .eq('id', payload.workspaceId)
    .single();

  try {
    if (!payload.stripeClientId || !payload.stripeRedirectUri) {
      return new NextResponse(
        authCallbackErrorHtml(
          'stripe',
          'OAuth session is outdated. Close this tab, return to Excel, and click Connect Stripe again.'
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
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
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
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
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Failed to connect Stripe.';

    if (isStripePlatformSelfConnectError(raw)) {
      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'stripe/callback/route.ts:platform-fallback',message:'oauth platform self — linking via API key',data:{workspaceId:payload.workspaceId},timestamp:Date.now(),hypothesisId:'S2',runId:'post-fix'})}).catch(()=>{});
      // #endregion
      try {
        const platformAccountId = await getStripePlatformAccountId();

        if (ws?.account_id) {
          const check = await enforceStripeConnect(
            ws.account_id,
            payload.workspaceId,
            platformAccountId ?? undefined
          );
          if (!check.allowed) {
            return new NextResponse(
              authCallbackErrorHtml('stripe', check.reason!),
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          }
        }

        const platform = await connectPlatformStripeAccount(
          payload.workspaceId,
          payload.userId
        );

        // #region agent log
        fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'stripe/callback/route.ts:platform-success',message:'platform linked',data:{stripeAccountId:platform.stripeAccountId},timestamp:Date.now(),hypothesisId:'S2',runId:'post-fix'})}).catch(()=>{});
        // #endregion
        return new NextResponse(
          authCallbackHtml({
            status: 'stripe_connected',
            stripe_user_id: platform.stripeAccountId,
            connection_type: 'platform',
          }),
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      } catch (fallbackErr) {
        const message =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : 'Could not link your Stripe platform account.';
        return new NextResponse(authCallbackErrorHtml('stripe', message), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }

    const message = formatStripeConnectConfigError(raw);
    return new NextResponse(authCallbackErrorHtml('stripe', message), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
