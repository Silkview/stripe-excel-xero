import { ACCOUNT_MAPPING_STRIPE_OBJECTS } from '../config/workbookSheets';
import {
  ACCOUNT_FIRST_DATA_ROW,
  ACCOUNT_LAST_DATA_ROW,
  CONTACT_FIRST_DATA_ROW,
  writeAccountMappingsLayout,
} from './accountMappingsExcel';
import { colLetter } from './officeHelpers';

const ACCOUNT_MAPPINGS_SHEET = 'Account_Mappings';
const PAYOUT_CLEARING = 'stripe_payout_clearing';
const STRIPE_CLEARING = 'stripe_clearing';
const PAYOUT_CONTACT_KEY = 'stripe_payout_contact';

const LEGACY_FIRST_DATA_ROW = 2;
const LEGACY_COL_STRIPE_OBJECT = 0;
const LEGACY_COL_ACCOUNT = 1;
const LEGACY_COL_TAX = 2;
const LEGACY_COL_TRACKING_NAME = 3;
const LEGACY_COL_TRACKING_OPTION = 4;
const LEGACY_COL_CONTACT = 5;

const LEGACY_HEADER_HINTS = [
  'stripe_object',
  'stripe object',
  'xero_account_code',
  'xero account code',
];

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
 * Merge legacy stripe_payout_clearing row into stripe_clearing (older bug fix).
 * Returns the possibly-mutated rows so the caller can rewrite the sheet.
 */
function mergeLegacyPayoutClearing(rows: unknown[][]): unknown[][] {
  let payoutClearingIdx = -1;
  let stripeClearingIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    const obj = String(rows[i][LEGACY_COL_STRIPE_OBJECT] ?? '')
      .trim()
      .toLowerCase();
    if (obj === PAYOUT_CLEARING) payoutClearingIdx = i;
    if (obj === STRIPE_CLEARING) stripeClearingIdx = i;
  }

  if (payoutClearingIdx < 0) return rows;

  const payoutRow = [...rows[payoutClearingIdx]];

  if (stripeClearingIdx >= 0) {
    const clearingRow = rows[stripeClearingIdx];
    copyIfEmpty(clearingRow, payoutRow, LEGACY_COL_ACCOUNT);
    copyIfEmpty(clearingRow, payoutRow, LEGACY_COL_TAX);
    copyIfEmpty(clearingRow, payoutRow, LEGACY_COL_TRACKING_NAME);
    copyIfEmpty(clearingRow, payoutRow, LEGACY_COL_TRACKING_OPTION);
    copyIfEmpty(clearingRow, payoutRow, LEGACY_COL_CONTACT);
    rows[stripeClearingIdx] = clearingRow;
    rows.splice(payoutClearingIdx, 1);
  } else {
    payoutRow[LEGACY_COL_STRIPE_OBJECT] = STRIPE_CLEARING;
    rows[payoutClearingIdx] = payoutRow;
  }

  return rows;
}

function isLegacySingleSectionLayout(
  headerCellA1: unknown,
  firstDataCellA2: unknown
): boolean {
  const a1 = String(headerCellA1 ?? '')
    .trim()
    .toLowerCase();
  const a2 = String(firstDataCellA2 ?? '')
    .trim()
    .toLowerCase();
  if (!LEGACY_HEADER_HINTS.includes(a1)) return false;
  return ACCOUNT_MAPPING_STRIPE_OBJECTS.some(
    (k) => k.toLowerCase() === a2 || a2 === PAYOUT_CONTACT_KEY
  );
}

/**
 * Migrate the Account_Mappings sheet to the current two-section layout:
 *
 * 1. Merge any legacy `stripe_payout_clearing` row into `stripe_clearing`.
 * 2. If the sheet still uses the old single-section layout (header in row 1,
 *    `xero_contact` as col F), capture any user-selected values and repaint
 *    using `writeAccountMappingsLayout`, restoring values into the new cells.
 *
 * Safe to call repeatedly — no-op once the sheet is already in the new shape.
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
    const lastColIndex = Math.max(used.columnCount, 6);
    const endCol = colLetter(lastColIndex);

    const headerProbe = sheet.getRange(`A1:${endCol}2`);
    headerProbe.load('values');
    await context.sync();

    const probeRows = (headerProbe.values as unknown[][]) ?? [];
    const legacyLayout = isLegacySingleSectionLayout(
      probeRows[0]?.[0],
      probeRows[1]?.[0]
    );

    if (!legacyLayout) {
      // Already on the new layout (or an unknown shape we shouldn't touch).
      return;
    }

    const dataRange = sheet.getRange(
      `A${LEGACY_FIRST_DATA_ROW}:${endCol}${lastRow}`
    );
    dataRange.load('values');
    await context.sync();

    let rows = (dataRange.values as unknown[][]) ?? [];
    rows = mergeLegacyPayoutClearing(rows);

    // Capture per-key values from the legacy table.
    type LegacyRow = {
      accountValue: unknown;
      taxValue: unknown;
      trackingName: unknown;
      trackingOption: unknown;
    };
    const byKey = new Map<string, LegacyRow>();
    let bankTransferContact: unknown = '';

    for (const row of rows) {
      const key = String(row[LEGACY_COL_STRIPE_OBJECT] ?? '')
        .trim()
        .toLowerCase();
      if (!key) continue;
      if (key === PAYOUT_CONTACT_KEY) {
        bankTransferContact = row[LEGACY_COL_CONTACT];
        continue;
      }
      byKey.set(key, {
        accountValue: row[LEGACY_COL_ACCOUNT],
        taxValue: row[LEGACY_COL_TAX],
        trackingName: row[LEGACY_COL_TRACKING_NAME],
        trackingOption: row[LEGACY_COL_TRACKING_OPTION],
      });
    }

    // Repaint the sheet in the new two-section layout.
    writeAccountMappingsLayout(sheet);
    await context.sync();

    // Restore captured values into the new account section rows (B..E).
    const restoredRows: unknown[][] = ACCOUNT_MAPPING_STRIPE_OBJECTS.map(
      (key) => {
        const prior = byKey.get(key);
        return [
          prior?.accountValue ?? '',
          prior?.taxValue ?? '',
          prior?.trackingName ?? '',
          prior?.trackingOption ?? '',
        ];
      }
    );

    sheet
      .getRange(`B${ACCOUNT_FIRST_DATA_ROW}:E${ACCOUNT_LAST_DATA_ROW}`)
      .values = restoredRows;

    if (!isEmptyCell(bankTransferContact)) {
      sheet.getRange(`B${CONTACT_FIRST_DATA_ROW}`).values = [
        [bankTransferContact],
      ];
    }

    sheet.getUsedRange().format.autofitColumns();
    await context.sync();
  });
}
