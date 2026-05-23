import type { StripePayoutBalanceTransactionRow } from '@stripesync/shared';

export const PAYOUT_COLUMN_COUNT = 9;

export type BalanceTrxPayoutAccountMeta = {
  stripeAccountId: string;
  stripeAccountName: string;
};

export type BalanceTrxPayoutTaggedRow = {
  row: StripePayoutBalanceTransactionRow;
  account: BalanceTrxPayoutAccountMeta;
};

function blankRow(columnCount: number): unknown[] {
  return Array.from({ length: columnCount }, () => '');
}

function rowToSheetCells(
  row: StripePayoutBalanceTransactionRow,
  includePayoutColumns: boolean,
  accountPrefix: [string, string]
): unknown[] {
  const payoutCells = includePayoutColumns
    ? [
        row.payout_id,
        row.payout_arrival_date,
        row.payout_gross_amount,
        row.payout_fee_amount,
        row.payout_net_amount,
        row.payout_currency,
        row.payout_status,
        row.payout_description,
        row.payout_bank_account_last4,
      ]
    : Array.from({ length: PAYOUT_COLUMN_COUNT }, () => '');

  const trxCells = [
    row.transaction_id,
    row.created,
    row.available_on,
    row.amount,
    row.fee,
    row.net,
    row.currency,
    row.type,
    row.reporting_category,
    row.description,
    row.source_id,
  ];

  return [...accountPrefix, ...payoutCells, ...trxCells];
}

function groupKey(tagged: BalanceTrxPayoutTaggedRow): string {
  return `${tagged.account.stripeAccountId}\0${tagged.row.payout_id}`;
}

function compareGroups(
  a: BalanceTrxPayoutTaggedRow[],
  b: BalanceTrxPayoutTaggedRow[]
): number {
  const headA = a[0];
  const headB = b[0];
  const byAccount = headA.account.stripeAccountId.localeCompare(
    headB.account.stripeAccountId
  );
  if (byAccount !== 0) return byAccount;

  const byArrival = headA.row.payout_arrival_date.localeCompare(
    headB.row.payout_arrival_date
  );
  if (byArrival !== 0) return byArrival;

  return headA.row.payout_id.localeCompare(headB.row.payout_id);
}

function compareWithinGroup(
  a: BalanceTrxPayoutTaggedRow,
  b: BalanceTrxPayoutTaggedRow
): number {
  const byCreated = a.row.created.localeCompare(b.row.created);
  if (byCreated !== 0) return byCreated;
  return a.row.type.localeCompare(b.row.type);
}

/** Groups by account + payout_id; payout cols on first row only; blank row between groups. */
export function formatBalanceTrxPayoutsTaggedForSheet(
  tagged: BalanceTrxPayoutTaggedRow[],
  columnCount: number
): unknown[][] {
  const groups = new Map<string, BalanceTrxPayoutTaggedRow[]>();

  for (const item of tagged) {
    const key = groupKey(item);
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  const sortedGroups = [...groups.values()].sort(compareGroups);

  const out: unknown[][] = [];
  let isFirstGroup = true;

  for (const group of sortedGroups) {
    if (!isFirstGroup) {
      out.push(blankRow(columnCount));
    }
    isFirstGroup = false;

    const rows = [...group].sort(compareWithinGroup);
    rows.forEach((item, index) => {
      const prefix: [string, string] = [
        item.account.stripeAccountId,
        item.account.stripeAccountName,
      ];
      out.push(rowToSheetCells(item.row, index === 0, prefix));
    });
  }

  return out;
}

/** @deprecated Use formatBalanceTrxPayoutsTaggedForSheet */
export function formatBalanceTrxPayoutsForSheet(
  rows: StripePayoutBalanceTransactionRow[],
  columnCount: number,
  accountPrefix: [string, string] | null = null
): unknown[][] {
  const tagged: BalanceTrxPayoutTaggedRow[] = rows.map((row) => ({
    row,
    account: {
      stripeAccountId: accountPrefix?.[0] ?? '',
      stripeAccountName: accountPrefix?.[1] ?? '',
    },
  }));
  return formatBalanceTrxPayoutsTaggedForSheet(tagged, columnCount);
}
