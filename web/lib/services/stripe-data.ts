import axios, { AxiosError } from 'axios';
import type {
  StripeBalanceTransactionRow,
  StripeChargeRow,
  StripePayoutBalanceTransactionRow,
  StripePayoutRow,
} from '@stripesync/shared';
import {
  STRIPE_API_PAGE_SIZE,
  type StripeFetchLimits,
} from '@stripesync/shared/pullLimits';
import { REQUEST_TIMEOUT_MS } from '../api-response';
import { getOAuthRedirectUri } from '../oauth-redirect';
import {
  getStripeConnectClientId,
  getStripePlatformSecretKey,
} from '../stripe-connect-config';
import {
  limitsForRemainingItems,
  paginateStripeList,
} from './stripe-list-paginated';

const STRIPE_API = 'https://api.stripe.com/v1';

function formatDate(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toISOString().slice(0, 10);
}

function dateRangeToUnix(from: string, to: string): { fromTs: number; toTs: number } {
  return {
    fromTs: Math.floor(new Date(`${from}T00:00:00Z`).getTime() / 1000),
    toTs: Math.floor(new Date(`${to}T23:59:59Z`).getTime() / 1000),
  };
}

function stripeId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value) {
    return String((value as { id: string }).id);
  }
  return '';
}

function mapPayout(payout: Record<string, unknown>): StripePayoutRow {
  const amount = (payout.amount as number) / 100;
  const destination = payout.destination as Record<string, unknown> | string | null;
  let bank_account_last4 = '';
  if (destination && typeof destination === 'object') {
    bank_account_last4 = (destination.last4 as string) || '';
  }

  return {
    payout_id: payout.id as string,
    arrival_date: formatDate(payout.arrival_date as number),
    gross_amount: amount,
    fee_amount: 0,
    net_amount: amount,
    currency: ((payout.currency as string) || '').toUpperCase(),
    status: payout.status as string,
    description: (payout.description as string) || '',
    bank_account_last4,
  };
}

function mapBalanceTransaction(
  txn: Record<string, unknown>
): StripeBalanceTransactionRow {
  return {
    transaction_id: txn.id as string,
    created: formatDate(txn.created as number),
    available_on: formatDate(txn.available_on as number),
    amount: (txn.amount as number) / 100,
    fee: (txn.fee as number) / 100,
    net: (txn.net as number) / 100,
    currency: ((txn.currency as string) || '').toUpperCase(),
    type: (txn.type as string) || '',
    reporting_category: (txn.reporting_category as string) || '',
    description: (txn.description as string) || '',
    source_id: stripeId(txn.source),
  };
}

const EMPTY_BALANCE_TXN: StripeBalanceTransactionRow = {
  transaction_id: '',
  created: '',
  available_on: '',
  amount: 0,
  fee: 0,
  net: 0,
  currency: '',
  type: '',
  reporting_category: '',
  description: '',
  source_id: '',
};

function mapPayoutBalanceTransactionRow(
  payout: StripePayoutRow,
  txn?: StripeBalanceTransactionRow
): StripePayoutBalanceTransactionRow {
  const bt = txn ?? EMPTY_BALANCE_TXN;
  return {
    payout_id: payout.payout_id,
    payout_arrival_date: payout.arrival_date,
    payout_gross_amount: payout.gross_amount,
    payout_fee_amount: payout.fee_amount,
    payout_net_amount: payout.net_amount,
    payout_currency: payout.currency,
    payout_status: payout.status,
    payout_description: payout.description,
    payout_bank_account_last4: payout.bank_account_last4,
    transaction_id: bt.transaction_id,
    created: bt.created,
    available_on: bt.available_on,
    amount: bt.amount,
    fee: bt.fee,
    net: bt.net,
    currency: bt.currency || payout.currency,
    type: bt.type,
    reporting_category: bt.reporting_category,
    description: bt.description,
    source_id: bt.source_id,
  };
}

export class StripeServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfter?: number
  ) {
    super(message);
  }
}

async function stripeListPaginated(
  accessToken: string,
  path: string,
  params: Record<string, unknown>,
  limits: StripeFetchLimits
): Promise<Record<string, unknown>[]> {
  try {
    return await paginateStripeList(async (startingAfter) => {
      const pageParams: Record<string, unknown> = {
        ...params,
        limit: STRIPE_API_PAGE_SIZE,
      };
      if (startingAfter) {
        pageParams.starting_after = startingAfter;
      }

      const response = await axios.get(`${STRIPE_API}${path}`, {
        params: pageParams,
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: REQUEST_TIMEOUT_MS,
      });

      return {
        data: response.data?.data ?? [],
        hasMore: Boolean(response.data?.has_more),
      };
    }, limits);
  } catch (err) {
    throw mapStripeError(err);
  }
}

async function listBalanceTransactionsForPayout(
  accessToken: string,
  payoutId: string,
  limits: StripeFetchLimits
): Promise<StripeBalanceTransactionRow[]> {
  const data = await stripeListPaginated(
    accessToken,
    '/balance_transactions',
    { payout: payoutId },
    limits
  );
  return data.map((t) => mapBalanceTransaction(t));
}

export async function getPayoutLinkedBalanceTransactions(
  accessToken: string,
  from: string,
  to: string,
  limits: StripeFetchLimits
): Promise<StripePayoutBalanceTransactionRow[]> {
  try {
    const payouts = await getPayouts(accessToken, from, to, limits);
    const combined: StripePayoutBalanceTransactionRow[] = [];

    for (const payout of payouts) {
      if (combined.length >= limits.maxItems) break;

      const remaining = limits.maxItems - combined.length;
      const perPayoutLimits = limitsForRemainingItems(limits, remaining);
      const txns = (
        await listBalanceTransactionsForPayout(
          accessToken,
          payout.payout_id,
          perPayoutLimits
        )
      ).filter((t) => t.type.toLowerCase() !== 'payout');

      if (txns.length === 0) {
        combined.push(mapPayoutBalanceTransactionRow(payout));
      } else {
        for (const txn of txns) {
          if (combined.length >= limits.maxItems) break;
          combined.push(mapPayoutBalanceTransactionRow(payout, txn));
        }
      }
    }

    return combined;
  } catch (err) {
    throw mapStripeError(err);
  }
}

function mapCharge(charge: Record<string, unknown>): StripeChargeRow {
  const pmd = charge.payment_method_details as Record<string, unknown> | undefined;
  return {
    charge_id: charge.id as string,
    created: formatDate(charge.created as number),
    amount: (charge.amount as number) / 100,
    amount_captured: (charge.amount_captured as number) / 100,
    currency: ((charge.currency as string) || '').toUpperCase(),
    status: (charge.status as string) || '',
    customer_id: stripeId(charge.customer),
    description: (charge.description as string) || '',
    payment_method: (pmd?.type as string) || '',
    paid: Boolean(charge.paid),
  };
}

export async function getPayouts(
  accessToken: string,
  from: string,
  to: string,
  limits: StripeFetchLimits
): Promise<StripePayoutRow[]> {
  const { fromTs, toTs } = dateRangeToUnix(from, to);
  try {
    const data = await stripeListPaginated(
      accessToken,
      '/payouts',
      {
        'arrival_date[gte]': fromTs,
        'arrival_date[lte]': toTs,
        expand: ['data.destination'],
      },
      limits
    );
    return data.map((p) => mapPayout(p));
  } catch (err) {
    throw mapStripeError(err);
  }
}

export async function getBalanceTransactions(
  accessToken: string,
  from: string,
  to: string,
  limits: StripeFetchLimits
): Promise<StripeBalanceTransactionRow[]> {
  const { fromTs, toTs } = dateRangeToUnix(from, to);
  try {
    const data = await stripeListPaginated(
      accessToken,
      '/balance_transactions',
      {
        'created[gte]': fromTs,
        'created[lte]': toTs,
      },
      limits
    );
    return data.map((t) => mapBalanceTransaction(t));
  } catch (err) {
    throw mapStripeError(err);
  }
}

export async function getCharges(
  accessToken: string,
  from: string,
  to: string,
  limits: StripeFetchLimits
): Promise<StripeChargeRow[]> {
  const { fromTs, toTs } = dateRangeToUnix(from, to);
  try {
    const data = await stripeListPaginated(
      accessToken,
      '/charges',
      {
        'created[gte]': fromTs,
        'created[lte]': toTs,
      },
      limits
    );
    return data.map((c) => mapCharge(c));
  } catch (err) {
    throw mapStripeError(err);
  }
}

export async function exchangeStripeCode(
  code: string,
  options?: { clientId?: string; redirectUri?: string }
): Promise<{
  access_token: string;
  stripe_user_id: string;
}> {
  const clientId = options?.clientId ?? getStripeConnectClientId();
  const redirectUri = options?.redirectUri ?? getOAuthRedirectUri('stripe');

  try {
    const response = await axios.post(
      'https://connect.stripe.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: getStripePlatformSecretKey(),
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );
    return {
      access_token: response.data.access_token,
      stripe_user_id: response.data.stripe_user_id,
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as {
        error_description?: string;
        error?: string;
      };
      const detail = body.error_description ?? body.error;
      if (detail) {
        throw new StripeServiceError('STRIPE_ERROR', detail);
      }
    }
    throw mapStripeError(err);
  }
}

function mapStripeError(err: unknown): StripeServiceError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError;
    if (axiosErr.code === 'ECONNABORTED') {
      return new StripeServiceError('TIMEOUT', 'The request timed out. Please try again.');
    }
    if (axiosErr.response?.status === 429) {
      const retryAfter = parseInt(
        axiosErr.response.headers['retry-after'] as string,
        10
      );
      return new StripeServiceError(
        'RATE_LIMITED',
        'Stripe rate limit reached. Please wait and try again.',
        retryAfter
      );
    }
    if (axiosErr.response?.status === 401) {
      return new StripeServiceError(
        'STRIPE_AUTH_REQUIRED',
        'Your Stripe connection has expired. Please reconnect.'
      );
    }
  }
  return new StripeServiceError(
    'STRIPE_ERROR',
    'Something went wrong connecting to Stripe. Please try again.'
  );
}
