import { useState, useEffect } from 'react';
import type {
  StripeBalanceTransactionRow,
  StripeChargeRow,
  StripeConnectionItem,
  StripePayoutBalanceTransactionRow,
  StripePayoutRow,
  StripePullResponse,
} from '@stripesync/shared';
import Button from './ui/Button';
import Field from './ui/Field';
import ResultBar from './ui/ResultBar';
import InfoRow from './ui/InfoRow';
import { apiGetWithStripeAccount } from '../utils/api';
import { friendlyError } from '../utils/errorMessages';
import { STRIPE_PULL_OBJECTS, type StripePullObjectType } from '../config/workbookSheets';
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
import { formatBalanceTrxPayoutsTaggedForSheet } from '../utils/stripeBalanceTrxPayoutsSheet';

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

type PullRow =
  | StripePayoutRow
  | StripeBalanceTransactionRow
  | StripePayoutBalanceTransactionRow
  | StripeChargeRow;

type AccountMeta = {
  stripeAccountId: string;
  stripeAccountName: string;
};

type TaggedRow = {
  row: PullRow;
  account: AccountMeta;
};

function compareTaggedRows(
  objectType: StripePullObjectType,
  a: TaggedRow,
  b: TaggedRow
): number {
  const byAccount = a.account.stripeAccountId.localeCompare(
    b.account.stripeAccountId
  );
  if (byAccount !== 0) return byAccount;

  let dateA: string;
  let dateB: string;
  let tertiaryA: string;
  let tertiaryB: string;

  switch (objectType) {
    case 'payouts': {
      const ra = a.row as StripePayoutRow;
      const rb = b.row as StripePayoutRow;
      dateA = ra.arrival_date;
      dateB = rb.arrival_date;
      tertiaryA = ra.payout_id;
      tertiaryB = rb.payout_id;
      break;
    }
    case 'charges': {
      const ra = a.row as StripeChargeRow;
      const rb = b.row as StripeChargeRow;
      dateA = ra.created;
      dateB = rb.created;
      tertiaryA = ra.status;
      tertiaryB = rb.status;
      break;
    }
    case 'balance_transactions':
    case 'balance_trx_payouts':
    default: {
      const ra = a.row as StripeBalanceTransactionRow;
      const rb = b.row as StripeBalanceTransactionRow;
      dateA = ra.created;
      dateB = rb.created;
      tertiaryA = ra.type;
      tertiaryB = rb.type;
      break;
    }
  }

  const byDate = dateA.localeCompare(dateB);
  if (byDate !== 0) return byDate;
  return tertiaryA.localeCompare(tertiaryB);
}

function accountPrefix(account: AccountMeta): [string, string] {
  return [account.stripeAccountId, account.stripeAccountName];
}

function mapRowsToSheetData(
  objectType: StripePullObjectType,
  tagged: TaggedRow[]
): { headers: string[]; data: unknown[][] } {
  const pullMeta = STRIPE_PULL_OBJECTS[objectType];

  switch (objectType) {
    case 'payouts':
      return {
        headers: pullMeta.displayHeaders,
        data: tagged.map(({ row, account }) => [
          ...accountPrefix(account),
          (row as StripePayoutRow).payout_id,
          (row as StripePayoutRow).arrival_date,
          (row as StripePayoutRow).gross_amount,
          (row as StripePayoutRow).fee_amount,
          (row as StripePayoutRow).net_amount,
          (row as StripePayoutRow).currency,
          (row as StripePayoutRow).status,
          (row as StripePayoutRow).description,
          (row as StripePayoutRow).bank_account_last4,
        ]),
      };
    case 'balance_transactions':
      return {
        headers: pullMeta.displayHeaders,
        data: tagged.map(({ row, account }) => [
          ...accountPrefix(account),
          (row as StripeBalanceTransactionRow).transaction_id,
          (row as StripeBalanceTransactionRow).created,
          (row as StripeBalanceTransactionRow).available_on,
          (row as StripeBalanceTransactionRow).amount,
          (row as StripeBalanceTransactionRow).fee,
          (row as StripeBalanceTransactionRow).net,
          (row as StripeBalanceTransactionRow).currency,
          (row as StripeBalanceTransactionRow).type,
          (row as StripeBalanceTransactionRow).reporting_category,
          (row as StripeBalanceTransactionRow).description,
          (row as StripeBalanceTransactionRow).source_id,
        ]),
      };
    case 'balance_trx_payouts':
      throw new Error('balance_trx_payouts uses grouped sheet formatter');
    case 'charges':
      return {
        headers: pullMeta.displayHeaders,
        data: tagged.map(({ row, account }) => [
          ...accountPrefix(account),
          (row as StripeChargeRow).charge_id,
          (row as StripeChargeRow).created,
          (row as StripeChargeRow).amount,
          (row as StripeChargeRow).amount_captured,
          (row as StripeChargeRow).currency,
          (row as StripeChargeRow).status,
          (row as StripeChargeRow).customer_id,
          (row as StripeChargeRow).description,
          (row as StripeChargeRow).payment_method,
          (row as StripeChargeRow).paid,
        ]),
      };
  }
}

function truncateId(id: string, len = 12): string {
  if (id.length <= len) return id;
  return `${id.slice(0, len)}…`;
}

interface StripePanelProps {
  stripeConnected: boolean;
  selectedList: StripeConnectionItem[];
  currencyReady: boolean;
  defaultCurrency?: string;
  onPulled?: () => void;
}

export default function StripePanel({
  stripeConnected,
  selectedList,
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
    if (!selectedList.length) {
      setStatusMessage('Select at least one Stripe account.');
      setStatusError(true);
      return;
    }

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

      const endpoint = `${pullConfig.endpoint}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const allTagged: TaggedRow[] = [];
      let totalExcluded = 0;
      const perAccountCounts: string[] = [];

      for (let i = 0; i < selectedList.length; i++) {
        const conn = selectedList[i];
        const label = conn.displayName ?? truncateId(conn.stripeAccountId);
        setStatusMessage(
          `Pulling ${i + 1} of ${selectedList.length}: ${label}…`
        );

        const res = await apiGetWithStripeAccount<StripePullResponse<PullRow>>(
          endpoint,
          conn.stripeAccountId
        );

        if (!res.success || !res.data) {
          setStatusMessage(`Failed for ${label}: ${friendlyError(res)}`);
          setStatusError(true);
          return;
        }

        const accountMeta: AccountMeta = {
          stripeAccountId: conn.stripeAccountId,
          stripeAccountName: conn.displayName ?? conn.stripeAccountId,
        };

        for (const row of res.data.rows) {
          allTagged.push({ row, account: accountMeta });
        }

        totalExcluded += res.data.excludedByCurrency;
        perAccountCounts.push(`${label}: ${res.data.rows.length}`);
      }

      const { sheetName } = parseDestination(destination);
      let headers: string[];
      let data: unknown[][];

      if (objectType === 'balance_trx_payouts' && allTagged.length > 0) {
        const payoutTagged = allTagged.map((t) => ({
          row: t.row as StripePayoutBalanceTransactionRow,
          account: t.account,
        }));
        data = formatBalanceTrxPayoutsTaggedForSheet(
          payoutTagged,
          pullConfig.sheetKeys.length
        );
        headers = pullConfig.displayHeaders;
        const rowError = stripePullRowCountError(data.length);
        if (rowError) {
          setStatusMessage(rowError);
          setStatusError(true);
          return;
        }
      } else {
        allTagged.sort((a, b) => compareTaggedRows(objectType, a, b));
        const sheetRowCount = allTagged.length;
        const rowError = stripePullRowCountError(sheetRowCount);
        if (rowError) {
          setStatusMessage(rowError);
          setStatusError(true);
          return;
        }
        const mapped = mapRowsToSheetData(objectType, allTagged);
        headers = mapped.headers;
        data = mapped.data;
      }

      const sheetRowCount = data.length;
      await writeDataToSheet(sheetName, 'A1', data, headers);
      await activateWorksheet(sheetName, data.length > 0 ? 'A2' : 'A1');

      let msg = `${sheetRowCount} ${pullConfig.label.toLowerCase()} → ${sheetName}`;
      if (selectedList.length > 1) {
        msg += ` (${perAccountCounts.join('; ')})`;
      }
      if (totalExcluded > 0) {
        msg += ` (${totalExcluded} other currencies excluded)`;
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
    <div className="p-3.5">
      {!stripeConnected && (
        <InfoRow variant="amber">Connect Stripe above to pull data.</InfoRow>
      )}
      {stripeConnected && selectedList.length === 0 && (
        <InfoRow variant="amber">Select one or more Stripe accounts above.</InfoRow>
      )}
      {!currencyReady && (
        <InfoRow variant="amber">
          Connect Xero first to set your organisation currency. Pull is disabled until then.
        </InfoRow>
      )}
      {currencyReady && defaultCurrency && (
        <InfoRow>
          Only {defaultCurrency} rows are pulled (from your Xero organisation).
        </InfoRow>
      )}

      <Field label="Object">
          <select
            value={objectType}
            onChange={(e) =>
              setObjectType(e.target.value as StripePullObjectType)
            }
            className="w-full border border-border rounded-lg px-2.5 py-2 text-[13px] bg-white outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(37,99,235,0.07)]"
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

      <div className="grid grid-cols-2 gap-2">
        <Field label="From">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full border border-border rounded-lg px-2.5 py-2 text-[13px] bg-white outline-none focus:border-accent"
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full border border-border rounded-lg px-2.5 py-2 text-[13px] bg-white outline-none focus:border-accent"
          />
        </Field>
      </div>

      <InfoRow>
        Max {MAX_STRIPE_PULL_DAYS} days per pull and {MAX_STRIPE_PULL_ROWS.toLocaleString()}{' '}
        rows total. Each selected account is pulled separately, then merged and sorted.
      </InfoRow>

      <Field label="Destination">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full border border-border rounded-lg px-2.5 py-2 text-[11.5px] font-mono text-accent bg-white outline-none focus:border-accent"
          spellCheck={false}
        />
      </Field>

      <Button
        variant="primary"
        onClick={handlePull}
        disabled={
          !stripeConnected ||
          !currencyReady ||
          loading ||
          selectedList.length === 0
        }
        className="mt-1"
      >
        {loading ? 'Pulling…' : 'Pull to sheet'}
      </Button>

      {(statusMessage || loading) && (
        <ResultBar variant={statusError ? 'warn' : 'success'}>
          {loading ? (statusMessage ?? 'Fetching from Stripe…') : (statusMessage ?? '')}
        </ResultBar>
      )}
    </div>
  );
}
