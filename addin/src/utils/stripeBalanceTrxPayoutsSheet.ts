import type { StripePayoutBalanceTransactionRow } from '@stripesync/shared';

export const PAYOUT_COLUMN_COUNT = 9;

function blankRow(columnCount: number): unknown[] {
  return Array.from({ length: columnCount }, () => '');
}

function rowToSheetCells(
  row: StripePayoutBalanceTransactionRow,
  includePayoutColumns: boolean,
  accountPrefix: [string, string] | null
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

  return accountPrefix
    ? [...accountPrefix, ...payoutCells, ...trxCells]
    : [...payoutCells, ...trxCells];
}

/** Groups by payout_id in first-seen order, with separators and payout cols on first row only. */
export function formatBalanceTrxPayoutsForSheet(
  rows: StripePayoutBalanceTransactionRow[],
  columnCount: number,
  accountPrefix: [string, string] | null = null
): unknown[][] {
  const out: unknown[][] = [];
  const groups = new Map<string, StripePayoutBalanceTransactionRow[]>();

  for (const row of rows) {
    const existing = groups.get(row.payout_id);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(row.payout_id, [row]);
    }
  }

  let isFirstGroup = true;
  for (const groupRows of groups.values()) {
    if (!isFirstGroup) {
      out.push(blankRow(columnCount));
    }
    isFirstGroup = false;

    groupRows.forEach((row, index) => {
      out.push(rowToSheetCells(row, index === 0, accountPrefix));
    });
  }

  return out;
}
