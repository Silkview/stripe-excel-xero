import { useState, useEffect } from 'react';
import type {
  StripeBalanceTransactionRow,
  StripeChargeRow,
  StripePayoutRow,
  StripePullResponse,
} from '@stripesync/shared';
import Card from './ui/Card';
import Button from './ui/Button';
import Field from './ui/Field';
import ResultBar from './ui/ResultBar';
import Badge from './ui/Badge';
import InfoRow from './ui/InfoRow';
import { apiGet } from '../utils/api';
import { friendlyError } from '../utils/errorMessages';
import {
  PAYOUT_HEADERS,
  BALANCE_TRANSACTION_HEADERS,
  CHARGE_HEADERS,
  STRIPE_PULL_OBJECTS,
  type StripePullObjectType,
} from '../config/workbookSheets';
import {
  MAX_STRIPE_PULL_DAYS,
  MAX_STRIPE_PULL_ROWS,
  stripePullRangeError,
  stripePullRowCountError,
} from '@stripesync/shared/pullLimits';
import {
  writeDataToSheet,
  parseDestination,
  activateWorksheet,
} from '../utils/officeHelpers';

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
  stripeConnected: boolean;
  currencyReady: boolean;
  defaultCurrency?: string;
  onPulled?: () => void;
}

export default function StripePanel({
  stripeConnected,
  currencyReady,
  defaultCurrency,
  onPulled,
}: StripePanelProps) {
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
      const rangeError = stripePullRangeError(from, to);
      if (rangeError) {
        setStatusMessage(rangeError);
        setStatusError(true);
        return;
      }

      type PullRow =
        | StripePayoutRow
        | StripeBalanceTransactionRow
        | StripeChargeRow;

      const res = await apiGet<StripePullResponse<PullRow>>(
        `${pullConfig.endpoint}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );

      if (!res.success || !res.data) {
        setStatusMessage(friendlyError(res));
        setStatusError(true);
        return;
      }

      const { rows, excludedByCurrency } = res.data;
      const rowError = stripePullRowCountError(rows.length);
      if (rowError) {
        setStatusMessage(rowError);
        setStatusError(true);
        return;
      }

      const { headers, data } = mapRowsToSheetData(objectType, rows);
      const { sheetName } = parseDestination(destination);
      await writeDataToSheet(sheetName, 'A1', data, headers);
      await activateWorksheet(sheetName, data.length > 0 ? 'A2' : 'A1');

      let msg = `${rows.length} ${pullConfig.label.toLowerCase()} → ${sheetName}`;
      if (excludedByCurrency > 0) {
        msg += ` (${excludedByCurrency} other currencies excluded)`;
      }
      setStatusMessage(msg);
      onPulled?.();
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
    <div className="p-3">
      <Card
        title="Pull from Stripe"
        icon="↓"
        iconClass="bg-stripe-light text-stripe"
        badge={
          stripeConnected ? (
            <Badge variant="success">Connected</Badge>
          ) : (
            <Badge variant="warn">Connect Stripe</Badge>
          )
        }
      >
        {!currencyReady && (
          <InfoRow className="mb-2 text-warn">
            Connect Xero first to set your organisation currency. Pull is disabled until then.
          </InfoRow>
        )}
        {currencyReady && defaultCurrency && (
          <InfoRow className="mb-2">
            Only {defaultCurrency} rows are pulled (from your Xero organisation).
          </InfoRow>
        )}
        <Field label="Object">
          <select
            value={objectType}
            onChange={(e) =>
              setObjectType(e.target.value as StripePullObjectType)
            }
            className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-surface"
          >
            {(Object.keys(STRIPE_PULL_OBJECTS) as StripePullObjectType[]).map(
              (key) => (
                <option key={key} value={key}>
                  {STRIPE_PULL_OBJECTS[key].label}
                </option>
              )
            )}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <Field label="From">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-surface"
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-surface"
            />
          </Field>
        </div>

        <InfoRow className="mt-2 mb-0">
          Max {MAX_STRIPE_PULL_DAYS} days per pull and {MAX_STRIPE_PULL_ROWS.toLocaleString()}{' '}
          rows. Exceeding either limit shows an error and does not write to the sheet.
        </InfoRow>

        <Field label="Destination" className="mt-2">
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full border border-border rounded-sm px-2 py-1.5 text-xs font-mono bg-surface"
            spellCheck={false}
          />
        </Field>

        <Button
          variant="primary"
          onClick={handlePull}
          disabled={!stripeConnected || !currencyReady || loading}
          className="mt-2"
        >
          {loading ? 'Pulling…' : '↓ Pull to sheet'}
        </Button>
      </Card>

      {(statusMessage || loading) && (
        <ResultBar variant={statusError ? 'warn' : 'success'}>
          {loading ? 'Fetching from Stripe…' : (statusMessage ?? '')}
        </ResultBar>
      )}
    </div>
  );
}
