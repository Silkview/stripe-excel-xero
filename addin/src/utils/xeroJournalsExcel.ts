import { rowMatchesCurrency } from '@stripesync/shared/currencyFilter';
import { BT_IDX_CURRENCY } from '../config/xeroBankTransactionBuilder';
import {
  BT_SHEET,
  JOURNAL_SHEET,
  MAPPING_SHEET,
  type BalanceTxnType,
  type JournalDescriptionKind,
  descriptionFormula,
  narrationFormula,
  journalDateCellRef,
  mappingFormula,
  sumifsAmount,
  sumifsFee,
} from '../config/xeroJournalBuilder';
import { WORKBOOK_SHEETS } from '../config/workbookSheets';
import { colLetter } from './officeHelpers';
import { clearSheetDataArea } from './sheetClear';

const BT_FIRST_DATA_ROW = 2;
const JOURNAL_FIRST_DATA_ROW = 2;
/** Data columns A–H; sheet also has Xero ID in I. */
const JOURNAL_COL_COUNT = 8;
const JOURNAL_SHEET_COL_COUNT = 9;

/** BT columns: A=transaction_id, B=created, ... H=type, ... */
const BT_IDX_CREATED = 1;
const BT_IDX_FEE = 4;
const BT_IDX_TYPE = 7;

export interface BuildJournalsResult {
  lineCount: number;
  chargeDates: number;
  refundDates: number;
  feeDates: number;
}

type JournalFormulas = [
  string | number | null,
  string | number | null,
  string | number | null,
  string | number | null,
  string | number | null,
  string | number | null,
  string | number | null,
  string | number | null,
];

/** Normalized YYYY-MM-DD key for grouping (local calendar, no UTC shift). */
function dateKey(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    return excelSerialToDateKey(value);
  }
  if (value instanceof Date) {
    return formatLocalYmd(value);
  }
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return formatLocalYmd(d);
  return s;
}

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Excel 1900 date serial → local YYYY-MM-DD (matches Excel SUMIFS on date cells). */
function excelSerialToDateKey(serial: number): string {
  const epoch = Date.UTC(1899, 11, 30);
  const d = new Date(epoch + serial * 86400000);
  return formatLocalYmd(
    new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

/** Preserve Excel serial or string so journal Date column matches BT column B. */
function journalDateValue(
  stored: string | number | undefined,
  key: string
): string | number {
  if (typeof stored === 'number') return stored;
  if (typeof stored === 'string' && stored.length > 0) return stored;
  return key;
}

function parseFee(value: unknown): number {
  if (typeof value === 'number') return value;
  const n = parseFloat(String(value));
  return Number.isNaN(n) ? 0 : n;
}

function sortedUnique(dates: Set<string>): string[] {
  return [...dates].sort();
}

function collectDatesFromRows(
  rows: unknown[][],
  predicate: (row: unknown[]) => boolean,
  dateValues: Map<string, string | number>
): string[] {
  const dates = new Set<string>();
  for (const row of rows) {
    if (!predicate(row)) continue;
    const key = dateKey(row[BT_IDX_CREATED]);
    if (!key) continue;
    dates.add(key);
    if (!dateValues.has(key)) {
      dateValues.set(key, row[BT_IDX_CREATED] as string | number);
    }
  }
  return sortedUnique(dates);
}

function collectFeeDates(
  rows: unknown[][],
  dateValues: Map<string, string | number>
): string[] {
  const feeByDate = new Map<string, number>();
  for (const row of rows) {
    const key = dateKey(row[BT_IDX_CREATED]);
    if (!key) continue;
    feeByDate.set(key, (feeByDate.get(key) ?? 0) + parseFee(row[BT_IDX_FEE]));
    if (!dateValues.has(key)) {
      dateValues.set(key, row[BT_IDX_CREATED] as string | number);
    }
  }
  const dates: string[] = [];
  for (const [date, total] of feeByDate) {
    if (total !== 0) dates.push(date);
  }
  return dates.sort();
}

function makeLine(
  dateKeyStr: string,
  dateValues: Map<string, string | number>,
  row: number,
  stripeObject: string,
  descriptionKind: JournalDescriptionKind,
  netAmountFormula: string
): JournalFormulas {
  const dateRef = journalDateCellRef(row);
  return [
    journalDateValue(dateValues.get(dateKeyStr), dateKeyStr),
    narrationFormula(row),
    mappingFormula('account', stripeObject),
    descriptionFormula(descriptionKind, dateRef),
    netAmountFormula,
    mappingFormula('tax', stripeObject),
    mappingFormula('trackingName', stripeObject),
    mappingFormula('trackingOption', stripeObject),
  ];
}

function addTypePair(
  lines: JournalFormulas[],
  dateKeyStr: string,
  dateValues: Map<string, string | number>,
  type: BalanceTxnType,
  descriptionKind: JournalDescriptionKind,
  startRow: number,
  lastRow: number
): number {
  const row = startRow + lines.length;
  const dateRef = journalDateCellRef(row);
  lines.push(
    makeLine(
      dateKeyStr,
      dateValues,
      row,
      type,
      descriptionKind,
      sumifsAmount(type, dateRef, lastRow)
    )
  );
  const clearingRow = startRow + lines.length;
  const clearingDateRef = journalDateCellRef(clearingRow);
  lines.push(
    makeLine(
      dateKeyStr,
      dateValues,
      clearingRow,
      'stripe_clearing',
      descriptionKind,
      sumifsAmount(type, clearingDateRef, lastRow, true)
    )
  );
  return lines.length;
}

function addFeePair(
  lines: JournalFormulas[],
  dateKeyStr: string,
  dateValues: Map<string, string | number>,
  startRow: number,
  lastRow: number
): number {
  const row = startRow + lines.length;
  const dateRef = journalDateCellRef(row);
  lines.push(
    makeLine(
      dateKeyStr,
      dateValues,
      row,
      'fee',
      'Fees',
      sumifsFee(dateRef, lastRow)
    )
  );
  const clearingRow = startRow + lines.length;
  const clearingDateRef = journalDateCellRef(clearingRow);
  lines.push(
    makeLine(
      dateKeyStr,
      dateValues,
      clearingRow,
      'stripe_clearing',
      'Fees',
      sumifsFee(clearingDateRef, lastRow, true)
    )
  );
  return lines.length;
}

function filterBtRowsByCurrency(
  rows: unknown[][],
  defaultCurrency: string
): unknown[][] {
  return rows.filter((row) =>
    rowMatchesCurrency(String(row[BT_IDX_CURRENCY] ?? ''), defaultCurrency)
  );
}

export async function buildXeroJournalsFromBalanceTransactions(
  defaultCurrency: string
): Promise<BuildJournalsResult> {
  await clearSheetDataArea(
    JOURNAL_SHEET,
    JOURNAL_FIRST_DATA_ROW,
    colLetter(JOURNAL_SHEET_COL_COUNT)
  );

  return await Excel.run(async (context) => {
    const btSheet =
      context.workbook.worksheets.getItemOrNullObject(BT_SHEET);
    const mappingSheet =
      context.workbook.worksheets.getItemOrNullObject(MAPPING_SHEET);
    const journalSheet =
      context.workbook.worksheets.getItemOrNullObject(JOURNAL_SHEET);

    btSheet.load('name');
    mappingSheet.load('name');
    journalSheet.load('name');
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
    if (journalSheet.isNullObject) {
      throw new Error(
        `${JOURNAL_SHEET} sheet not found. Run Set up workbook sheets first.`
      );
    }

    const journalHeaders = WORKBOOK_SHEETS.find((s) => s.name === JOURNAL_SHEET)
      ?.headers;
    if (journalHeaders) {
      const headerEnd = colLetter(journalHeaders.length);
      journalSheet.getRange(`A1:${headerEnd}1`).values = [journalHeaders];
    }

    const used = btSheet.getUsedRangeOrNullObject();
    used.load(['rowIndex', 'rowCount']);
    await context.sync();

    if (used.isNullObject || used.rowCount <= 1) {
      throw new Error(
        `${BT_SHEET} has no data. Pull balance transactions before building journals.`
      );
    }

    const lastRow = used.rowIndex + used.rowCount;
    const dataRange = btSheet.getRange(`A${BT_FIRST_DATA_ROW}:K${lastRow}`);
    dataRange.load('values');
    await context.sync();

    const allRows = dataRange.values as unknown[][];
    const rows = filterBtRowsByCurrency(allRows, defaultCurrency);

    if (rows.length === 0) {
      throw new Error(
        `No balance transactions in ${defaultCurrency}. Pull Stripe data for this currency or check your Xero organisation currency.`
      );
    }

    const dateValues = new Map<string, string | number>();

    const chargeDates = collectDatesFromRows(
      rows,
      (row) => String(row[BT_IDX_TYPE] ?? '').toLowerCase() === 'charge',
      dateValues
    );
    const refundDates = collectDatesFromRows(
      rows,
      (row) => String(row[BT_IDX_TYPE] ?? '').toLowerCase() === 'refund',
      dateValues
    );
    const feeDates = collectFeeDates(rows, dateValues);

    if (
      chargeDates.length === 0 &&
      refundDates.length === 0 &&
      feeDates.length === 0
    ) {
      throw new Error(
        'No charge, refund, or fee rows found in balance transactions.'
      );
    }

    const lines: JournalFormulas[] = [];
    const startRow = JOURNAL_FIRST_DATA_ROW;

    for (const date of chargeDates) {
      addTypePair(lines, date, dateValues, 'charge', 'Charges', startRow, lastRow);
    }
    for (const date of refundDates) {
      addTypePair(lines, date, dateValues, 'refund', 'Refunds', startRow, lastRow);
    }
    for (const date of feeDates) {
      addFeePair(lines, date, dateValues, startRow, lastRow);
    }

    const lastCol = colLetter(JOURNAL_COL_COUNT);

    if (lines.length > 0) {
      const writeEnd = JOURNAL_FIRST_DATA_ROW + lines.length - 1;

      const allValues: (string | number | null)[][] = [];
      const formulaCols: string[][] = [];

      for (const line of lines) {
        const valueRow: (string | number | null)[] = [];
        const formulaRow: string[] = [];
        for (let c = 0; c < JOURNAL_COL_COUNT; c++) {
          const cell = line[c];
          if (typeof cell === 'string' && cell.startsWith('=')) {
            valueRow.push('');
            formulaRow.push(cell);
          } else {
            valueRow.push(cell);
            formulaRow.push('');
          }
        }
        allValues.push(valueRow);
        formulaCols.push(formulaRow);
      }

      // Write values first so column A dates are not cleared by empty formula cells.
      journalSheet
        .getRange(`A${JOURNAL_FIRST_DATA_ROW}:${lastCol}${writeEnd}`)
        .values = allValues;

      journalSheet
        .getRange(`B${JOURNAL_FIRST_DATA_ROW}:${lastCol}${writeEnd}`)
        .formulas = formulaCols.map((row) => row.slice(1));

      const dateRange = journalSheet.getRange(
        `A${JOURNAL_FIRST_DATA_ROW}:A${writeEnd}`
      );
      dateRange.numberFormat = Array.from({ length: lines.length }, () => [
        'yyyy-mm-dd',
      ]);
    }

    journalSheet.getUsedRange().format.autofitColumns();
    await context.sync();

    return {
      lineCount: lines.length,
      chargeDates: chargeDates.length,
      refundDates: refundDates.length,
      feeDates: feeDates.length,
    };
  });
}
