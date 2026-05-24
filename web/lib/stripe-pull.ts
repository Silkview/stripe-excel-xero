import { filterRowsByCurrency } from '@stripesync/shared/currencyFilter';
import {
  stripePullRangeError,
  stripePullRowCountError,
  maxStripePullRows,
} from '@stripesync/shared/pullLimits';
import type { StripePullResponse } from '@stripesync/shared';
import type { PlanCode } from '@/lib/plans/types';
import { getStripeConnection } from './connections/store';
import { getWorkspaceDefaultCurrency, XeroServiceError } from './services/xero';
import { StripeServiceError } from './services/stripe-data';
import { jsonError } from './api-response';
import { withCors } from './cors';
import { createSupabaseAdmin } from './supabase/admin';
import { core } from './supabase/core';

type FetchFn = (
  accessToken: string,
  from: string,
  to: string
) => Promise<Array<{ currency: string }>>;

function resolveStripeAccountId(request: Request): string | null {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get('stripeAccountId');
  if (fromQuery) return fromQuery;
  return (
    request.headers.get('x-stripe-account-id') ||
    request.headers.get('X-Stripe-Account-Id') ||
    null
  );
}

async function getAccountPlanCode(accountId: string): Promise<PlanCode> {
  const admin = createSupabaseAdmin();
  const { data: account } = await core(admin)
    .from('accounts')
    .select('plan_code')
    .eq('id', accountId)
    .maybeSingle();
  return (account?.plan_code ?? 'free') as PlanCode;
}

export async function handleStripePull(
  request: Request,
  workspaceId: string,
  accountId: string,
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
    const planCode = await getAccountPlanCode(accountId);
    const isFreePlan = planCode === 'free';

    let defaultCurrency: string | null = null;
    if (!isFreePlan) {
      try {
        defaultCurrency = await getWorkspaceDefaultCurrency(workspaceId);
      } catch (err) {
        if (err instanceof XeroServiceError) {
          const status = err.code === 'XERO_AUTH_REQUIRED' ? 401 : 400;
          return withCors(request, jsonError(err.code, err.message, status));
        }
        throw err;
      }
    }

    const raw = await fetchFn(stripe.access_token, from, to);
    const totalBeforeCurrencyFilter = raw.length;
    let rows: typeof raw;
    let excludedByCurrency: number;

    if (defaultCurrency) {
      const filtered = filterRowsByCurrency(raw, defaultCurrency);
      rows = filtered.rows;
      excludedByCurrency = filtered.excludedByCurrency;
    } else {
      rows = raw;
      excludedByCurrency = 0;
    }

    const maxRows = maxStripePullRows(planCode);
    const rowError = stripePullRowCountError(rows.length, maxRows);
    if (rowError) {
      return withCors(request, jsonError('VALIDATION_ERROR', rowError, 400));
    }

    const payload: StripePullResponse<unknown> = {
      currency: defaultCurrency ?? 'ALL',
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
