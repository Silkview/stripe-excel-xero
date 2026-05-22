import axios, { AxiosError } from 'axios';
import type {
  StripeBalanceTransactionRow,
  StripeChargeRow,
  StripePayoutRow,
} from '@stripesync/shared';
import { REQUEST_TIMEOUT_MS } from '../api-response';

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

export class StripeServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfter?: number
  ) {
    super(message);
  }
}

async function stripeListGet(
  accessToken: string,
  path: string,
  params: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  const response = await axios.get(`${STRIPE_API}${path}`, {
    params,
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: REQUEST_TIMEOUT_MS,
  });
  return response.data?.data ?? [];
}

export async function getPayouts(
  accessToken: string,
  from: string,
  to: string
): Promise<StripePayoutRow[]> {
  const { fromTs, toTs } = dateRangeToUnix(from, to);
  try {
    const data = await stripeListGet(accessToken, '/payouts', {
      'arrival_date[gte]': fromTs,
      'arrival_date[lte]': toTs,
      limit: 100,
      expand: ['data.destination'],
    });
    return data.map((p) => mapPayout(p));
  } catch (err) {
    throw mapStripeError(err);
  }
}

export async function getBalanceTransactions(
  accessToken: string,
  from: string,
  to: string
): Promise<StripeBalanceTransactionRow[]> {
  const { fromTs, toTs } = dateRangeToUnix(from, to);
  try {
    const data = await stripeListGet(accessToken, '/balance_transactions', {
      'created[gte]': fromTs,
      'created[lte]': toTs,
      limit: 100,
    });
    return data.map((t) => mapBalanceTransaction(t));
  } catch (err) {
    throw mapStripeError(err);
  }
}

export async function getCharges(
  accessToken: string,
  from: string,
  to: string
): Promise<StripeChargeRow[]> {
  const { fromTs, toTs } = dateRangeToUnix(from, to);
  try {
    const data = await stripeListGet(accessToken, '/charges', {
      'created[gte]': fromTs,
      'created[lte]': toTs,
      limit: 100,
    });
    return data.map((c) => mapCharge(c));
  } catch (err) {
    throw mapStripeError(err);
  }
}

export async function exchangeStripeCode(code: string): Promise<{
  access_token: string;
  stripe_user_id: string;
}> {
  try {
    const response = await axios.post(
      'https://connect.stripe.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.STRIPE_CLIENT_ID || '',
        client_secret:
          process.env.STRIPE_CONNECT_SECRET ||
          process.env.STRIPE_SECRET_KEY ||
          '',
        code,
        redirect_uri:
          process.env.STRIPE_REDIRECT_URI ||
          'http://localhost:4003/api/stripe/callback',
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
