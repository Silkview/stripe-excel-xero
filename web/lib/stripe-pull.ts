import { filterRowsByCurrency } from '@stripesync/shared/currencyFilter';
import {
  stripePullRangeError,
  stripePullRowCountError,
} from '@stripesync/shared/pullLimits';
import type { StripePullResponse } from '@stripesync/shared';
import { getStripeConnection } from './connections/store';
import { getWorkspaceDefaultCurrency, XeroServiceError } from './services/xero';
import {
  getBalanceTransactions,
  getCharges,
  getPayouts,
  StripeServiceError,
} from './services/stripe-data';
import { jsonError } from './api-response';
import { withCors } from './cors';

type FetchFn = (
  accessToken: string,
  from: string,
  to: string
) => Promise<Array<{ currency: string }>>;

function resolveStripeAccountId(request: Request): string | null {
  return (
    request.headers.get('x-stripe-account-id') ||
    request.headers.get('X-Stripe-Account-Id') ||
    new URL(request.url).searchParams.get('stripeAccountId')
  );
}

export async function handleStripePull(
  request: Request,
  workspaceId: string,
  fetchFn: FetchFn,
  errorFallback: string
) {
  const stripeAccountId = resolveStripeAccountId(request);
  const stripe = await getStripeConnection(workspaceId, stripeAccountId);
  if (!stripe) {
    return withCors(
      request,
      jsonError(
        'STRIPE_AUTH_REQUIRED',
        'Stripe is not connected. Please connect your Stripe account.',
        401
      )
    );
  }

  const url = new URL(request.url);
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';

  if (!from || !to) {
    return withCors(
      request,
      jsonError(
        'VALIDATION_ERROR',
        'Please provide from and to date parameters (YYYY-MM-DD).'
      )
    );
  }

  const rangeError = stripePullRangeError(from, to);
  if (rangeError) {
    return withCors(request, jsonError('VALIDATION_ERROR', rangeError, 400));
  }

  try {
    let defaultCurrency: string;
    try {
      defaultCurrency = await getWorkspaceDefaultCurrency(workspaceId);
    } catch (err) {
      if (err instanceof XeroServiceError) {
        const status = err.code === 'XERO_AUTH_REQUIRED' ? 401 : 400;
        return withCors(request, jsonError(err.code, err.message, status));
      }
      throw err;
    }

    const raw = await fetchFn(stripe.access_token, from, to);
    const totalBeforeCurrencyFilter = raw.length;
    const { rows, excludedByCurrency } = filterRowsByCurrency(
      raw,
      defaultCurrency
    );

    const rowError = stripePullRowCountError(rows.length);
    if (rowError) {
      return withCors(request, jsonError('VALIDATION_ERROR', rowError, 400));
    }

    const payload: StripePullResponse<unknown> = {
      currency: defaultCurrency,
      rows,
      excludedByCurrency,
      totalBeforeCurrencyFilter,
    };
    const { jsonSuccess } = await import('./api-response');
    return withCors(request, jsonSuccess(payload));
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
      return withCors(
        request,
        jsonError(err.code, err.message, status, {
          retry_after: err.retryAfter,
        })
      );
    }
    return withCors(request, jsonError('STRIPE_ERROR', errorFallback, 502));
  }
}
