import { useState, useEffect, useCallback } from 'react';
import type {
  StripeBalanceTransactionRow,
  StripeChargeRow,
  StripeConnectionItem,
  StripePayoutBalanceTransactionRow,
  StripePayoutRow,
  StripePullResponse,
} from '@stripesync/shared';
import Card from './ui/Card';
import Button from './ui/Button';
import Field from './ui/Field';
import ResultBar from './ui/ResultBar';
import Badge from './ui/Badge';
import InfoRow from './ui/InfoRow';
import { apiGetWithStripeAccount } from '../utils/api';
import { friendlyError } from '../utils/errorMessages';
import {
  PAYOUT_HEADERS,
  BALANCE_TRANSACTION_HEADERS,
  PAYOUT_BALANCE_TRANSACTION_HEADERS,
  CHARGE_HEADERS,
  STRIPE_ACCOUNT_HEADERS,
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
import { formatBalanceTrxPayoutsForSheet } from '../utils/stripeBalanceTrxPayoutsSheet';

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
  sortKey: string;
};

function sortKeyForRow(objectType: StripePullObjectType, row: PullRow): string {
  switch (objectType) {
    case 'payouts':
      return (row as StripePayoutRow).arrival_date;
    case 'balance_transactions':
    case 'balance_trx_payouts':
    case 'charges':
      return (row as StripeBalanceTransactionRow).created;
  }
}

function mapRowsToSheetData(
  objectType: StripePullObjectType,
  tagged: TaggedRow[],
  includeAccountColumns: boolean
): { headers: string[]; data: unknown[][] } {
  const accountPrefix = (account: AccountMeta): unknown[] =>
    includeAccountColumns
      ? [account.stripeAccountId, account.stripeAccountName]
      : [];

  const baseHeaders = (headers: string[]) =>
    includeAccountColumns
      ? [...STRIPE_ACCOUNT_HEADERS, ...headers]
      : headers;

  switch (objectType) {
    case 'payouts':
      return {
        headers: baseHeaders(PAYOUT_HEADERS),
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
        headers: baseHeaders(BALANCE_TRANSACTION_HEADERS),
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
    case 'balance_trx_payouts': {
      const headers = baseHeaders(PAYOUT_BALANCE_TRANSACTION_HEADERS);
      return {
        headers,
        data: tagged.map(({ row, account }) => {
          const r = row as StripePayoutBalanceTransactionRow;
          const cells = [
            r.payout_id,
            r.payout_arrival_date,
            r.payout_gross_amount,
            r.payout_fee_amount,
            r.payout_net_amount,
            r.payout_currency,
            r.payout_status,
            r.payout_description,
            r.payout_bank_account_last4,
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
          ];
          return includeAccountColumns
            ? [...accountPrefix(account), ...cells]
            : cells;
        }),
      };
    }
    case 'charges':
      return {
        headers: baseHeaders(CHARGE_HEADERS),
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
  stripeConnections: StripeConnectionItem[];
  defaultStripeAccountId?: string;
  currencyReady: boolean;
  defaultCurrency?: string;
  onPulled?: () => void;
}

export default function StripePanel({
  stripeConnected,
  stripeConnections,
  defaultStripeAccountId,
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
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(
    new Set()
  );

  const initSelection = useCallback(() => {
    if (!stripeConnections.length) {
      setSelectedAccountIds(new Set());
      return;
    }
    const defaultId =
      defaultStripeAccountId ??
      stripeConnections.find((c) => c.isDefault)?.stripeAccountId ??
      stripeConnections[0]?.stripeAccountId;
    setSelectedAccountIds(defaultId ? new Set([defaultId]) : new Set());
  }, [stripeConnections, defaultStripeAccountId]);

  useEffect(() => {
    initSelection();
  }, [initSelection]);

  useEffect(() => {
    setDestination(defaultDestination(objectType));
  }, [objectType]);

  const pullConfig = STRIPE_PULL_OBJECTS[objectType];
  const selectedList = stripeConnections.filter((c) =>
    selectedAccountIds.has(c.stripeAccountId)
  );
  const multiAccount = selectedList.length > 1;

  const toggleAccount = (stripeAccountId: string) => {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(stripeAccountId)) {
        next.delete(stripeAccountId);
      } else {
        next.add(stripeAccountId);
      }
      return next;
    });
  };

  const selectAllAccounts = () => {
    setSelectedAccountIds(
      new Set(stripeConnections.map((c) => c.stripeAccountId))
    );
  };

  const clearAccountSelection = () => {
    setSelectedAccountIds(new Set());
  };

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
          setStatusMessage(
            `Failed for ${label}: ${friendlyError(res)}`
          );
          setStatusError(true);
          return;
        }

        const accountMeta: AccountMeta = {
          stripeAccountId: conn.stripeAccountId,
          stripeAccountName: conn.displayName ?? conn.stripeAccountId,
        };

        for (const row of res.data.rows) {
          allTagged.push({
            row,
            account: accountMeta,
            sortKey: sortKeyForRow(objectType, row),
          });
        }

        totalExcluded += res.data.excludedByCurrency;
        perAccountCounts.push(`${label}: ${res.data.rows.length}`);
      }

      const { sheetName } = parseDestination(destination);
      let headers: string[];
      let data: unknown[][];

      if (
        objectType === 'balance_trx_payouts' &&
        selectedList.length === 1 &&
        allTagged.length > 0
      ) {
        const payoutRows = allTagged.map(
          (t) => t.row as StripePayoutBalanceTransactionRow
        );
        const colCount = PAYOUT_BALANCE_TRANSACTION_HEADERS.length;
        data = formatBalanceTrxPayoutsForSheet(payoutRows, colCount);
        headers = PAYOUT_BALANCE_TRANSACTION_HEADERS;
        const rowError = stripePullRowCountError(data.length);
        if (rowError) {
          setStatusMessage(rowError);
          setStatusError(true);
          return;
        }
      } else {
        allTagged.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
        const sheetRowCount = allTagged.length;
        const rowError = stripePullRowCountError(sheetRowCount);
        if (rowError) {
          setStatusMessage(rowError);
          setStatusError(true);
          return;
        }
        const mapped = mapRowsToSheetData(
          objectType,
          allTagged,
          multiAccount
        );
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

        {stripeConnections.length > 0 && (
          <Field label="Stripe accounts">
            {stripeConnections.length > 1 && (
              <div className="flex gap-2 mb-1.5">
                <button
                  type="button"
                  onClick={selectAllAccounts}
                  className="text-[10px] font-semibold text-stripe"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearAccountSelection}
                  className="text-[10px] font-semibold text-text-3"
                >
                  Clear
                </button>
              </div>
            )}
            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto border border-border rounded-sm p-2 bg-bg">
              {stripeConnections.map((c) => {
                const label = c.displayName ?? c.stripeAccountId;
                const checked = selectedAccountIds.has(c.stripeAccountId);
                return (
                  <label
                    key={c.id}
                    className="flex items-start gap-2 text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAccount(c.stripeAccountId)}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="font-medium text-text">{label}</span>
                      <span className="block font-mono text-[10px] text-text-3 truncate">
                        {truncateId(c.stripeAccountId, 20)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </Field>
        )}

        <Field label="Object" className="mt-2">
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
          rows total on the sheet. Each selected account is pulled separately, then merged and sorted by date.
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
          disabled={
            !stripeConnected ||
            !currencyReady ||
            loading ||
            selectedList.length === 0
          }
          className="mt-2"
        >
          {loading ? 'Pulling…' : '↓ Pull to sheet'}
        </Button>
      </Card>

      {(statusMessage || loading) && (
        <ResultBar variant={statusError ? 'warn' : 'success'}>
          {loading ? (statusMessage ?? 'Fetching from Stripe…') : (statusMessage ?? '')}
        </ResultBar>
      )}
    </div>
  );
}
