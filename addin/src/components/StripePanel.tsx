import { useState, useEffect, useMemo } from 'react';
import type {
  PlanCode,
  StripeBalanceTransactionRow,
  StripeChargeRow,
  StripeConnectionItem,
  StripePayoutBalanceTransactionRow,
  StripePayoutRow,
  StripePullResponse,
} from '@stripesync/shared';
import Button from './ui/Button';
import Field from './ui/Field';
import { apiGetWithStripeAccount } from '../utils/api';
import { friendlyError } from '../utils/errorMessages';
import { STRIPE_PULL_OBJECTS, type StripePullObjectType } from '../config/workbookSheets';
import {
  MAX_STRIPE_PULL_DAYS,
  maxStripePullRows,
  stripePullRangeError,
  stripePullRowCountError,
} from '@stripesync/shared/pullLimits';
import {
  writeDataToSheet,
  parseDestination,
  activateWorksheet,
} from '../utils/officeHelpers';
import { formatBalanceTrxPayoutsTaggedForSheet } from '../utils/stripeBalanceTrxPayoutsSheet';
import { useNotifications } from '../context/NotificationContext';

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
  connections: StripeConnectionItem[];
  planCode?: PlanCode | null;
  currencyReady: boolean;
  defaultCurrency?: string;
  xeroFeaturesEnabled?: boolean;
  onPulled?: () => void;
}

export default function StripePanel({
  stripeConnected,
  selectedList,
  connections,
  planCode = null,
  currencyReady,
  defaultCurrency,
  xeroFeaturesEnabled = true,
  onPulled,
}: StripePanelProps) {
  const { publish, clear } = useNotifications();
  const isFreePlan = planCode === 'free';
  const maxPullRows = maxStripePullRows(planCode);

  const accountsForPull = useMemo(
    () =>
      selectedList.length > 0
        ? selectedList
        : isFreePlan && connections.length > 0
          ? connections
          : [],
    [selectedList, isFreePlan, connections]
  );
  const monthRange = getCurrentMonthRange();
  const [objectType, setObjectType] = useState<StripePullObjectType>('payouts');
  const [from, setFrom] = useState(monthRange.from);
  const [to, setTo] = useState(monthRange.to);
  const [destination, setDestination] = useState(defaultDestination('payouts'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDestination(defaultDestination(objectType));
  }, [objectType]);

  useEffect(() => {
    let prereq: string | null = null;
    if (!stripeConnected) {
      prereq = 'Connect Stripe above to pull data.';
    } else if (accountsForPull.length === 0) {
      prereq = 'Select one or more Stripe accounts above.';
    } else if (!isFreePlan && xeroFeaturesEnabled && !currencyReady) {
      prereq =
        'Connect Xero first to set your organisation currency. Pull is disabled until then.';
    }
    if (prereq) {
      publish({ kind: 'warn', message: prereq, source: 'pull-prereq' });
    } else {
      clear('pull-prereq');
    }
  }, [
    stripeConnected,
    accountsForPull.length,
    currencyReady,
    isFreePlan,
    xeroFeaturesEnabled,
    publish,
    clear,
  ]);

  useEffect(() => {
    if (isFreePlan) {
      publish({
        kind: 'success',
        message: 'All Stripe currencies are included on the Free plan.',
        source: 'pull-info',
      });
    } else if (currencyReady && defaultCurrency) {
      publish({
        kind: 'success',
        message: `Only ${defaultCurrency} rows are pulled (from your Xero organisation).`,
        source: 'pull-info',
      });
    } else {
      clear('pull-info');
    }
  }, [isFreePlan, currencyReady, defaultCurrency, publish, clear]);

  useEffect(() => {
    const limitsMessage = isFreePlan
      ? `Free plan: up to ${MAX_STRIPE_PULL_DAYS} days and ${maxPullRows} transactions per pull.`
      : `Max ${MAX_STRIPE_PULL_DAYS} days per pull and ${maxPullRows.toLocaleString()} rows total. Each selected account is pulled separately, then merged and sorted.`;
    publish({
      kind: 'success',
      message: limitsMessage,
      source: 'pull-limits',
    });
    return () => {
      clear('pull');
      clear('pull-prereq');
      clear('pull-info');
      clear('pull-limits');
    };
  }, [isFreePlan, maxPullRows, publish, clear]);

  const pullConfig = STRIPE_PULL_OBJECTS[objectType];

  const notifyPull = (message: string, isError: boolean) => {
    publish({
      kind: isError ? 'error' : 'success',
      message,
      source: 'pull',
    });
  };

  const handlePull = async () => {
    if (!accountsForPull.length) {
      notifyPull('Select at least one Stripe account.', true);
      return;
    }

    setLoading(true);
    clear('pull');

    try {
      const rangeError = stripePullRangeError(from, to);
      if (rangeError) {
        notifyPull(rangeError, true);
        return;
      }

      const endpoint = `${pullConfig.endpoint}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const allTagged: TaggedRow[] = [];
      let totalExcluded = 0;
      const perAccountCounts: string[] = [];

      for (let i = 0; i < accountsForPull.length; i++) {
        const conn = accountsForPull[i];
        const label = conn.displayName ?? truncateId(conn.stripeAccountId);
        publish({
          kind: 'success',
          message: `Pulling ${i + 1} of ${accountsForPull.length}: ${label}…`,
          source: 'pull',
        });

        const res = await apiGetWithStripeAccount<StripePullResponse<PullRow>>(
          endpoint,
          conn.stripeAccountId
        );

        if (!res.success || !res.data) {
          notifyPull(`Failed for ${label}: ${friendlyError(res)}`, true);
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
        const rowError = stripePullRowCountError(data.length, maxPullRows);
        if (rowError) {
          notifyPull(rowError, true);
          return;
        }
      } else {
        allTagged.sort((a, b) => compareTaggedRows(objectType, a, b));
        const sheetRowCount = allTagged.length;
        const rowError = stripePullRowCountError(sheetRowCount, maxPullRows);
        if (rowError) {
          notifyPull(rowError, true);
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
      if (accountsForPull.length > 1) {
        msg += ` (${perAccountCounts.join('; ')})`;
      }
      if (totalExcluded > 0) {
        msg += ` (${totalExcluded} other currencies excluded)`;
      }
      notifyPull(msg, false);
      onPulled?.();
    } catch (err) {
      notifyPull(
        err instanceof Error
          ? err.message
          : `Failed to pull ${pullConfig.label.toLowerCase()}.`,
        true
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3.5">
      <Field label="Object">
        <select
          value={objectType}
          onChange={(e) => setObjectType(e.target.value as StripePullObjectType)}
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
          loading ||
          accountsForPull.length === 0 ||
          (!isFreePlan && xeroFeaturesEnabled && !currencyReady)
        }
        className="mt-1"
      >
        {loading ? 'Pulling…' : 'Pull to sheet'}
      </Button>
    </div>
  );
}
