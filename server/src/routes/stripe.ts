import { Router, Request, Response } from 'express';
import { tokenStore } from '../tokenStore';
import { sendSuccess, sendError } from '../utils/response';
import {
  getPayouts,
  getBalanceTransactions,
  getCharges,
  StripeServiceError,
} from '../services/stripeService';
import { resolveSessionId } from '../utils/sessionId';

const router = Router();

type StripeFetchFn = (
  accessToken: string,
  from: string,
  to: string
) => Promise<unknown[]>;

async function handleStripeDatePull(
  req: Request,
  res: Response,
  fetchFn: StripeFetchFn,
  errorFallback: string
): Promise<void> {
  const sessionId = resolveSessionId(req);
  const stripe = tokenStore.getStripe(sessionId);

  if (!stripe) {
    sendError(
      res,
      'STRIPE_AUTH_REQUIRED',
      'Stripe is not connected. Please connect your Stripe account.',
      401
    );
    return;
  }

  const from = req.query.from as string;
  const to = req.query.to as string;

  if (!from || !to) {
    sendError(
      res,
      'VALIDATION_ERROR',
      'Please provide from and to date parameters (YYYY-MM-DD).'
    );
    return;
  }

  try {
    const data = await fetchFn(stripe.access_token, from, to);
    sendSuccess(res, data);
  } catch (err) {
    if (err instanceof StripeServiceError) {
      const status =
        err.code === 'STRIPE_AUTH_REQUIRED'
          ? 401
          : err.code === 'RATE_LIMITED'
            ? 429
            : err.code === 'TIMEOUT'
              ? 504
              : 502;
      sendError(res, err.code, err.message, status, {
        retry_after: err.retryAfter,
      });
      return;
    }
    sendError(res, 'STRIPE_ERROR', errorFallback, 502);
  }
}

router.get('/payouts', (req, res) =>
  handleStripeDatePull(
    req,
    res,
    getPayouts,
    'Failed to fetch payouts. Please try again.'
  )
);

router.get('/balance-transactions', (req, res) =>
  handleStripeDatePull(
    req,
    res,
    getBalanceTransactions,
    'Failed to fetch balance transactions. Please try again.'
  )
);

router.get('/charges', (req, res) =>
  handleStripeDatePull(
    req,
    res,
    getCharges,
    'Failed to fetch charges. Please try again.'
  )
);

export default router;
