import { ACCOUNT_MAPPING_HEADERS } from '../config/workbookSheets';
import { colLetter } from './officeHelpers';

const ACCOUNT_MAPPINGS_SHEET = 'Account_Mappings';
const FIRST_DATA_ROW = 2;
const PAYOUT_CLEARING = 'stripe_payout_clearing';
const STRIPE_CLEARING = 'stripe_clearing';

const COL_STRIPE_OBJECT = 0;
const COL_ACCOUNT = 1;
const COL_TAX = 2;
const COL_TRACKING_NAME = 3;
const COL_TRACKING_OPTION = 4;
const COL_CONTACT = 5;

function isEmptyCell(value: unknown): boolean {
  const s = String(value ?? '').trim();
  return s === '' || s === '0';
}

function copyIfEmpty(target: unknown[], source: unknown[], col: number): void {
  if (isEmptyCell(target[col]) && !isEmptyCell(source[col])) {
    target[col] = source[col];
  }
}

/**
 * Merges legacy stripe_payout_clearing row into stripe_clearing and removes the duplicate row.
 */
export async function migrateAccountMappingsSheet(): Promise<void> {
  await Excel.run(async (context) => {
    const sheet =
      context.workbook.worksheets.getItemOrNullObject(ACCOUNT_MAPPINGS_SHEET);
    sheet.load('name');
    await context.sync();

    if (sheet.isNullObject) return;

    const used = sheet.getUsedRangeOrNullObject();
    used.load(['rowIndex', 'rowCount', 'columnCount']);
    await context.sync();

    if (used.isNullObject || used.rowCount <= 1) return;

    const lastRow = used.rowIndex + used.rowCount;
    const lastCol = Math.max(used.columnCount, ACCOUNT_MAPPING_HEADERS.length);
    const endCol = colLetter(lastCol);
    const dataRange = sheet.getRange(`A${FIRST_DATA_ROW}:${endCol}${lastRow}`);
    dataRange.load('values');
    await context.sync();

    const rows = (dataRange.values as unknown[][]) ?? [];
    let payoutClearingIdx = -1;
    let stripeClearingIdx = -1;

    for (let i = 0; i < rows.length; i++) {
      const obj = String(rows[i][COL_STRIPE_OBJECT] ?? '')
        .trim()
        .toLowerCase();
      if (obj === PAYOUT_CLEARING) payoutClearingIdx = i;
      if (obj === STRIPE_CLEARING) stripeClearingIdx = i;
    }

    if (payoutClearingIdx < 0) return;

    const payoutRow = [...rows[payoutClearingIdx]];

    if (stripeClearingIdx >= 0) {
      const clearingRow = rows[stripeClearingIdx];
      copyIfEmpty(clearingRow, payoutRow, COL_ACCOUNT);
      copyIfEmpty(clearingRow, payoutRow, COL_TAX);
      copyIfEmpty(clearingRow, payoutRow, COL_TRACKING_NAME);
      copyIfEmpty(clearingRow, payoutRow, COL_TRACKING_OPTION);
      copyIfEmpty(clearingRow, payoutRow, COL_CONTACT);
      rows[stripeClearingIdx] = clearingRow;
    } else {
      payoutRow[COL_STRIPE_OBJECT] = STRIPE_CLEARING;
      rows[payoutClearingIdx] = payoutRow;
      payoutClearingIdx = -1;
    }

    if (payoutClearingIdx >= 0) {
      rows.splice(payoutClearingIdx, 1);
    }

    if (rows.length > 0) {
      const writeEnd = FIRST_DATA_ROW + rows.length - 1;
      sheet.getRange(`A${FIRST_DATA_ROW}:${endCol}${writeEnd}`).values = rows;
      const clearBelow = sheet.getRange(
        `A${writeEnd + 1}:${endCol}${lastRow}`
      );
      clearBelow.clear(Excel.ClearApplyTo.contents);
    }

    await context.sync();
  });
}
