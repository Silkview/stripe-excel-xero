import { Router, Request, Response } from 'express';
import { tokenStore } from '../tokenStore';
import { generatePkcePair } from '../utils/pkce';
import {
  sendSuccess,
  sendError,
  authCallbackHtml,
  authCallbackErrorHtml,
} from '../utils/response';
import { exchangeStripeCode } from '../services/stripeService';
import {
  exchangeXeroCode,
  fetchXeroConnections,
} from '../services/xeroService';
import { resolveSessionId } from '../utils/sessionId';

const router = Router();

router.get('/session', (req: Request, res: Response) => {
  sendSuccess(res, { sessionId: req.session.id });
});

router.get('/stripe/connect', (req: Request, res: Response) => {
  const clientId = process.env.STRIPE_CLIENT_ID;
  const redirectUri =
    process.env.STRIPE_REDIRECT_URI ||
    'https://localhost:4000/auth/stripe/callback';

  if (!clientId) {
    return sendError(res, 'CONFIG_ERROR', 'Stripe is not configured on the server. Copy server/.env.example to server/.env and add your Stripe Connect credentials.', 503);
  }

  // #region agent log
  const fs = require('fs') as typeof import('fs');
  fs.appendFileSync('/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-49b4e5.log', JSON.stringify({sessionId:'49b4e5',runId:'redirect-fix',location:'auth.ts:stripe/connect',message:'stripe oauth redirect_uri',data:{redirectUri},timestamp:Date.now(),hypothesisId:'G'}) + '\n');
  // #endregion

  const sessionId = resolveSessionId(req);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'read_write',
    redirect_uri: redirectUri,
    state: sessionId,
  });

  const url = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  sendSuccess(res, { url, sessionId });
});

router.get('/stripe/status', (req: Request, res: Response) => {
  const cookieSession = req.session.id;
  const sessionId = resolveSessionId(req);
  const stripe = tokenStore.getStripe(sessionId);
  // #region agent log
  const fs = require('fs') as typeof import('fs');
  fs.appendFileSync('/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-49b4e5.log', JSON.stringify({sessionId:'49b4e5',runId:'session-fix',location:'auth.ts:stripe/status',message:'status check',data:{cookieSession,resolvedSession:sessionId,sessionMatch:cookieSession===sessionId,connected:!!stripe},timestamp:Date.now(),hypothesisId:'I'}) + '\n');
  // #endregion
  sendSuccess(res, {
    connected: !!stripe,
    stripe_user_id: stripe?.stripe_user_id,
  });
});

router.get('/stripe/callback', async (req: Request, res: Response) => {
  const { code, error, error_description, state } = req.query;

  // #region agent log
  const fs = require('fs') as typeof import('fs');
  fs.appendFileSync('/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-49b4e5.log', JSON.stringify({sessionId:'49b4e5',runId:'browser-oauth',location:'auth.ts:stripe/callback',message:'stripe callback hit',data:{hasCode:!!code,hasState:!!state,hasError:!!error},timestamp:Date.now(),hypothesisId:'H'}) + '\n');
  // #endregion

  if (error) {
    return res
      .status(200)
      .send(
        authCallbackErrorHtml(
          'stripe',
          (error_description as string) || (error as string)
        )
      );
  }

  if (!code || typeof code !== 'string') {
    return res
      .status(200)
      .send(authCallbackErrorHtml('stripe', 'No authorization code received.'));
  }

  const sessionId =
    typeof state === 'string' && state.length > 0 ? state : req.session.id;

  try {
    const tokens = await exchangeStripeCode(code);
    tokenStore.setStripe(sessionId, tokens);
    res
      .status(200)
      .send(
        authCallbackHtml({
          status: 'stripe_connected',
          stripe_user_id: tokens.stripe_user_id,
        })
      );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to connect Stripe.';
    res.status(200).send(authCallbackErrorHtml('stripe', message));
  }
});

router.get('/xero/connect', (req: Request, res: Response) => {
  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri =
    process.env.XERO_REDIRECT_URI || 'https://localhost:4000/auth/xero/callback';

  if (!clientId) {
    return sendError(res, 'CONFIG_ERROR', 'Xero is not configured on the server. Copy server/.env.example to server/.env and add your Xero app credentials.', 503);
  }

  const sessionId = resolveSessionId(req);
  const { codeVerifier, codeChallenge } = generatePkcePair();
  tokenStore.setPkceVerifier(sessionId, codeVerifier);

  const scopes = [
    'accounting.transactions',
    'accounting.settings',
    'accounting.reports.read',
    'offline_access',
  ].join(' ');

  // #region agent log
  const fsXero = require('fs') as typeof import('fs');
  fsXero.appendFileSync('/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-49b4e5.log', JSON.stringify({sessionId:'49b4e5',runId:'xero-redirect',location:'auth.ts:xero/connect',message:'xero oauth redirect_uri',data:{redirectUri,oauthSessionId:sessionId},timestamp:Date.now(),hypothesisId:'K'}) + '\n');
  // #endregion

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    state: sessionId,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const url = `https://login.xero.com/identity/connect/authorize?${params.toString()}`;
  sendSuccess(res, { url, sessionId });
});

router.get('/xero/callback', async (req: Request, res: Response) => {
  const { code, error, error_description, state } = req.query;

  if (error) {
    return res
      .status(200)
      .send(
        authCallbackErrorHtml(
          'xero',
          (error_description as string) || (error as string)
        )
      );
  }

  if (!code || typeof code !== 'string') {
    return res
      .status(200)
      .send(authCallbackErrorHtml('xero', 'No authorization code received.'));
  }

  const sessionId =
    typeof state === 'string' && state.length > 0 ? state : req.session.id;
  const codeVerifier = tokenStore.getPkceVerifier(sessionId);
  if (!codeVerifier) {
    return res
      .status(200)
      .send(authCallbackErrorHtml('xero', 'Session expired. Please try connecting again.'));
  }

  try {
    const tokenResponse = await exchangeXeroCode(code, codeVerifier);
    tokenStore.deletePkceVerifier(sessionId);

    const connections = await fetchXeroConnections(tokenResponse.access_token);
    if (connections.length === 0) {
      return res
        .status(200)
        .send(authCallbackErrorHtml('xero', 'No Xero organisation found.'));
    }

    const tenant = connections[0];
    tokenStore.setXero(sessionId, {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: Date.now() + tokenResponse.expires_in * 1000,
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
    });

    res.status(200).send(
      authCallbackHtml({
        status: 'xero_connected',
        tenantName: tenant.tenantName,
      })
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to connect Xero.';
    res.status(200).send(authCallbackErrorHtml('xero', message));
  }
});

export default router;
