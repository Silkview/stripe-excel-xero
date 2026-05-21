import {
  BANK_TXN_SHEET,
  BANK_TXN_SHEET_ALIASES,
  BANK_TXN_TYPE_RECEIVE,
  BT_IDX_AMOUNT,
  BT_IDX_AVAILABLE_ON,
  BT_IDX_CURRENCY,
  BT_IDX_SOURCE_ID,
  BT_IDX_TYPE,
  BT_SHEET,
  MAPPING_SHEET,
  MAPPING_STRIPE_PAYOUT_BANK,
  MAPPING_STRIPE_CLEARING,
  MAPPING_STRIPE_PAYOUT_CONTACT,
  mappingFormula,
} from '../config/xeroBankTransactionBuilder';
import { rowMatchesCurrency } from '@stripesync/shared/currencyFilter';
import { colLetter } from './officeHelpers';
import { clearSheetDataArea } from './sheetClear';

const BT_FIRST_DATA_ROW = 2;
const BANK_TXN_FIRST_DATA_ROW = 2;
const BANK_TXN_COL_COUNT = 7;
const BANK_TXN_SHEET_COL_COUNT = 8;

/** Columns with INDEX/MATCH mapping formulas (0-based). */
const FORMULA_COL_INDEXES = [2, 3, 5];

export interface BuildBankTransactionsResult {
  rowCount: number;
}

function parseAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  const n = parseFloat(String(value).replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

function isPayoutRow(row: unknown[]): boolean {
  return String(row[BT_IDX_TYPE] ?? '').toLowerCase() === 'payout';
}

type BankTxnRow = [
  string | number | null,
  string | number | null,
  string | number | null,
  string | number | null,
  string | number | null,
  string | number | null,
  string | number | null,
];

function makePayoutRow(
  availableOn: string | number,
  sourceId: string,
  amount: number
): BankTxnRow {
  return [
    availableOn,
    BANK_TXN_TYPE_RECEIVE,
    mappingFormula('contact', MAPPING_STRIPE_PAYOUT_CONTACT),
    mappingFormula('account', MAPPING_STRIPE_PAYOUT_BANK),
    sourceId,
    mappingFormula('account', MAPPING_STRIPE_CLEARING),
    amount,
  ];
}

async function resolveBankTransactionSheet(
  context: Excel.RequestContext
): Promise<Excel.Worksheet> {
  for (const name of BANK_TXN_SHEET_ALIASES) {
    const sheet = context.workbook.worksheets.getItemOrNullObject(name);
    sheet.load('name');
    await context.sync();
    if (!sheet.isNullObject) {
      return sheet;
    }
  }
  throw new Error(
    `${BANK_TXN_SHEET} sheet not found. Run Set up workbook sheets first.`
  );
}

export async function buildXeroBankTransactionsFromBalanceTransactions(
  defaultCurrency: string
): Promise<BuildBankTransactionsResult> {
  await clearSheetDataArea(
    BANK_TXN_SHEET,
    BANK_TXN_FIRST_DATA_ROW,
    colLetter(BANK_TXN_SHEET_COL_COUNT)
  );

  return await Excel.run(async (context) => {
    const btSheet =
      context.workbook.worksheets.getItemOrNullObject(BT_SHEET);
    const mappingSheet =
      context.workbook.worksheets.getItemOrNullObject(MAPPING_SHEET);

    btSheet.load('name');
    mappingSheet.load('name');
    await context.sync();

    if (btSheet.isNullObject) {
      throw new Error(
        `${BT_SHEET} sheet not found. Pull balance transactions or run Set up workbook sheets first.`
      );
    }
    if (mappingSheet.isNullObject) {
      throw new Error(
        `${MAPPING_SHEET} sheet not found. Run Set up workbook sheets first.`
      );
    }

    const bankSheet = await resolveBankTransactionSheet(context);

    const used = btSheet.getUsedRangeOrNullObject();
    used.load(['rowIndex', 'rowCount']);
    await context.sync();

    if (used.isNullObject || used.rowCount <= 1) {
      throw new Error(
        `${BT_SHEET} has no data. Pull balance transactions before building bank transactions.`
      );
    }

    const lastRow = used.rowIndex + used.rowCount;
    const dataRange = btSheet.getRange(`A${BT_FIRST_DATA_ROW}:K${lastRow}`);
    dataRange.load('values');
    await context.sync();

    const rows = dataRange.values as unknown[][];
    const payoutRows: BankTxnRow[] = [];

    for (const row of rows) {
      if (!isPayoutRow(row)) continue;
      if (
        !rowMatchesCurrency(String(row[BT_IDX_CURRENCY] ?? ''), defaultCurrency)
      ) {
        continue;
      }
      const availableOn = row[BT_IDX_AVAILABLE_ON];
      if (availableOn == null || availableOn === '') continue;
      const btAmount = parseAmount(row[BT_IDX_AMOUNT]);
      if (btAmount === 0) continue;
      const amount = -btAmount;
      const sourceId = String(row[BT_IDX_SOURCE_ID] ?? '').trim();
      payoutRows.push(
        makePayoutRow(availableOn as string | number, sourceId, amount)
      );
    }

    if (payoutRows.length === 0) {
      throw new Error(
        `No payout balance transactions in ${defaultCurrency} (type = payout). Pull Stripe data for this currency.`
      );
    }

    const lastCol = colLetter(BANK_TXN_COL_COUNT);

    const writeEnd = BANK_TXN_FIRST_DATA_ROW + payoutRows.length - 1;
    const allValues: (string | number | null)[][] = [];
    const formulaRows: string[][] = [];

    for (const row of payoutRows) {
      const valueRow: (string | number | null)[] = [];
      const formulaRow: string[] = [];
      for (let c = 0; c < BANK_TXN_COL_COUNT; c++) {
        const cell = row[c];
        if (typeof cell === 'string' && cell.startsWith('=')) {
          valueRow.push('');
          formulaRow.push(cell);
        } else {
          valueRow.push(cell);
          formulaRow.push('');
        }
      }
      allValues.push(valueRow);
      formulaRows.push(formulaRow);
    }

    // Write values first (Date, Type, Reference, Amount); formulas only on mapping columns.
    bankSheet
      .getRange(`A${BANK_TXN_FIRST_DATA_ROW}:${lastCol}${writeEnd}`)
      .values = allValues;

    for (const colIdx of FORMULA_COL_INDEXES) {
      const col = colLetter(colIdx + 1);
      bankSheet
        .getRange(`${col}${BANK_TXN_FIRST_DATA_ROW}:${col}${writeEnd}`)
        .formulas = formulaRows.map((row) => [row[colIdx]]);
    }

    const dateRange = bankSheet.getRange(
      `A${BANK_TXN_FIRST_DATA_ROW}:A${writeEnd}`
    );
    dateRange.numberFormat = Array.from({ length: payoutRows.length }, () => [
      'yyyy-mm-dd',
    ]);

    bankSheet.getUsedRange().format.autofitColumns();
    await context.sync();

    return { rowCount: payoutRows.length };
  });
}
