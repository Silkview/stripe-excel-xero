import { useState, useEffect } from 'react';
import type {
  StripeBalanceTransactionRow,
  StripeChargeRow,
  StripePayoutRow,
} from '@stripesync/shared';
import { apiGet } from '../utils/api';
import { friendlyError } from '../utils/errorMessages';
import {
  PAYOUT_HEADERS,
  BALANCE_TRANSACTION_HEADERS,
  CHARGE_HEADERS,
  STRIPE_PULL_OBJECTS,
  type StripePullObjectType,
} from '../config/workbookSheets';
import { writeDataToSheet, parseDestination } from '../utils/officeHelpers';

function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: fmt(from), to: fmt(to) };
}

function defaultDestination(objectType: StripePullObjectType): string {
  const sheet = STRIPE_PULL_OBJECTS[objectType].sheet;
  return `${sheet}!A1`;
}

function mapRowsToSheetData(
  objectType: StripePullObjectType,
  rows: StripePayoutRow[] | StripeBalanceTransactionRow[] | StripeChargeRow[]
): { headers: string[]; data: unknown[][] } {
  switch (objectType) {
    case 'payouts':
      return {
        headers: PAYOUT_HEADERS,
        data: (rows as StripePayoutRow[]).map((r) => [
          r.payout_id,
          r.arrival_date,
          r.gross_amount,
          r.fee_amount,
          r.net_amount,
          r.currency,
          r.status,
          r.description,
          r.bank_account_last4,
        ]),
      };
    case 'balance_transactions':
      return {
        headers: BALANCE_TRANSACTION_HEADERS,
        data: (rows as StripeBalanceTransactionRow[]).map((r) => [
          r.transaction_id,
          r.created,
          r.available_on,
          r.amount,
          r.fee,
          r.net,
          r.currency,
          r.type,
          r.reporting_category,
          r.description,
          r.source_id,
        ]),
      };
    case 'charges':
      return {
        headers: CHARGE_HEADERS,
        data: (rows as StripeChargeRow[]).map((r) => [
          r.charge_id,
          r.created,
          r.amount,
          r.amount_captured,
          r.currency,
          r.status,
          r.customer_id,
          r.description,
          r.payment_method,
          r.paid,
        ]),
      };
  }
}

interface StripePanelProps {
  connected: boolean;
}

export default function StripePanel({ connected }: StripePanelProps) {
  const monthRange = getCurrentMonthRange();
  const [objectType, setObjectType] = useState<StripePullObjectType>('payouts');
  const [from, setFrom] = useState(monthRange.from);
  const [to, setTo] = useState(monthRange.to);
  const [destination, setDestination] = useState(defaultDestination('payouts'));
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    setDestination(defaultDestination(objectType));
  }, [objectType]);

  const pullConfig = STRIPE_PULL_OBJECTS[objectType];

  const handlePull = async () => {
    setLoading(true);
    setStatusMessage(null);
    setStatusError(false);

    try {
      const res = await apiGet<
        StripePayoutRow[] | StripeBalanceTransactionRow[] | StripeChargeRow[]
      >(
        `${pullConfig.endpoint}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );

      if (!res.success || !res.data) {
        setStatusMessage(friendlyError(res));
        setStatusError(true);
        return;
      }

      const rows = res.data;
      const { headers, data } = mapRowsToSheetData(objectType, rows);
      const { sheetName } = parseDestination(destination);
      await writeDataToSheet(sheetName, 'A1', data, headers);

      const label = pullConfig.label.toLowerCase();
      setStatusMessage(
        `${rows.length} ${label} pulled to ${sheetName}`
      );
    } catch (err) {
      setStatusMessage(
        err instanceof Error
          ? err.message
          : `Failed to pull ${pullConfig.label.toLowerCase()}.`
      );
      setStatusError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-2">Pull from Stripe</h2>

      <label className="block text-xs text-gray-600 mb-1">Object</label>
      <select
        value={objectType}
        onChange={(e) => setObjectType(e.target.value as StripePullObjectType)}
        className="w-full border border-gray-300 rounded px-2 py-1 mb-2 text-sm"
      >
        {(Object.keys(STRIPE_PULL_OBJECTS) as StripePullObjectType[]).map(
          (key) => (
            <option key={key} value={key}>
              {STRIPE_PULL_OBJECTS[key].label}
            </option>
          )
        )}
      </select>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      <label className="block text-xs text-gray-600 mb-1">Destination</label>
      <input
        type="text"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1 mb-2 text-sm"
      />

      <button
        type="button"
        onClick={handlePull}
        disabled={!connected || loading}
        className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Pulling…' : '↓ Pull to sheet'}
      </button>

      {(statusMessage || loading) && (
        <p
          className={`mt-2 text-xs ${statusError ? 'text-red-600' : 'text-gray-600'}`}
          role="status"
        >
          {loading ? 'Fetching from Stripe…' : statusMessage}
        </p>
      )}
    </section>
  );
}
