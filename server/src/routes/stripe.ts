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
import { filterRowsByCurrency } from '@stripesync/shared/currencyFilter';
import {
  stripePullRangeError,
  stripePullRowCountError,
} from '@stripesync/shared/pullLimits';
import {
  getSessionDefaultCurrency,
  XeroServiceError,
} from '../services/xeroService';
import type { StripePullResponse } from '@stripesync/shared';

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

  const rangeError = stripePullRangeError(from, to);
  if (rangeError) {
    sendError(res, 'VALIDATION_ERROR', rangeError, 400);
    return;
  }

  try {
    let defaultCurrency: string;
    try {
      defaultCurrency = getSessionDefaultCurrency(sessionId);
    } catch (err) {
      if (err instanceof XeroServiceError) {
        const status = err.code === 'XERO_AUTH_REQUIRED' ? 401 : 400;
        sendError(res, err.code, err.message, status);
        return;
      }
      throw err;
    }

    const raw = await fetchFn(stripe.access_token, from, to);
    const totalBeforeCurrencyFilter = raw.length;
    const { rows, excludedByCurrency } = filterRowsByCurrency(
      raw as Array<{ currency: string }>,
      defaultCurrency
    );

    const rowError = stripePullRowCountError(rows.length);
    if (rowError) {
      sendError(res, 'VALIDATION_ERROR', rowError, 400);
      return;
    }

    const payload: StripePullResponse<unknown> = {
      currency: defaultCurrency,
      rows,
      excludedByCurrency,
      totalBeforeCurrencyFilter,
    };
    sendSuccess(res, payload);
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
