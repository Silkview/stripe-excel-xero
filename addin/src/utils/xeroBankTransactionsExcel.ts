import {
  BANK_TXN_SHEET,
  BANK_TXN_SHEET_ALIASES,
  BANK_TXN_TYPE_RECEIVE,
  BT_SHEET,
  MAPPING_SHEET,
  MAPPING_STRIPE_PAYOUT_BANK,
  MAPPING_STRIPE_CLEARING,
  bankTransferContactFormula,
  mappingFormula,
} from '../config/xeroBankTransactionBuilder';
import { WORKBOOK_SHEETS } from '../config/workbookSheets';
import { rowMatchesCurrency } from '@stripesync/shared/currencyFilter';
import { colLetter } from './officeHelpers';
import {
  columnIndex,
  loadSheetTable,
  rowValue,
} from './sheetHeaders';
import { clearEntireSheetUsedRange } from './sheetClear';

const BT_FIRST_DATA_ROW = 2;
const BANK_TXN_FIRST_DATA_ROW = 2;
/** Data columns A–G; sheet also has Xero ID in H and Status in I. */
const BANK_TXN_COL_COUNT = 7;

/** Columns with INDEX/MATCH mapping formulas (0-based within data cols). */
const FORMULA_COLS = [2, 3, 5];

export interface BuildBankTransactionsResult {
  rowCount: number;
}

function parseAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  const n = parseFloat(String(value).replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
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
    bankTransferContactFormula(),
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
  for (const name of BANK_TXN_SHEET_ALIASES) {
    await clearEntireSheetUsedRange(name);
  }

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

    const bankHeaders = WORKBOOK_SHEETS.find((s) => s.name === BANK_TXN_SHEET)
      ?.headers;
    if (bankHeaders) {
      const headerEnd = colLetter(bankHeaders.length);
      bankSheet.getRange(`A1:${headerEnd}1`).values = [bankHeaders];
    }

    const btTable = await loadSheetTable(btSheet, BT_FIRST_DATA_ROW, context);
    if (!btTable || btTable.rows.length === 0) {
      throw new Error(
        `${BT_SHEET} has no data. Pull balance transactions before building bank transactions.`
      );
    }

    const typeIdx = columnIndex(btTable.headerIndex, 'Type');
    const currencyIdx = columnIndex(btTable.headerIndex, 'Currency');
    const availableOnIdx = columnIndex(btTable.headerIndex, 'Available On');
    const amountIdx = columnIndex(btTable.headerIndex, 'Amount');
    const sourceIdIdx = columnIndex(btTable.headerIndex, 'Source ID');

  // #region agent log
  const samplePayout = btTable.rows.find(
    (row) => String(rowValue(row, typeIdx) ?? '').toLowerCase() === 'payout'
  );
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'xeroBankTransactionsExcel.ts:build',message:'bank build bt columns',data:{lastCol:btTable.lastColLetter,sourceIdIdx,sourceIdHeaderFound:sourceIdIdx>=0,sampleSourceId:samplePayout?String(rowValue(samplePayout,sourceIdIdx)??''):null},timestamp:Date.now(),hypothesisId:'H2-H3',runId:'pre-fix'})}).catch(()=>{});
  // #endregion

    const payoutRows: BankTxnRow[] = [];

    for (const row of btTable.rows) {
      if (String(rowValue(row, typeIdx) ?? '').toLowerCase() !== 'payout') {
        continue;
      }
      if (
        !rowMatchesCurrency(
          String(rowValue(row, currencyIdx) ?? ''),
          defaultCurrency
        )
      ) {
        continue;
      }
      const availableOn = rowValue(row, availableOnIdx);
      if (availableOn == null || availableOn === '') continue;
      const btAmount = parseAmount(rowValue(row, amountIdx));
      if (btAmount === 0) continue;
      const amount = -btAmount;
      const sourceId = String(rowValue(row, sourceIdIdx) ?? '').trim();
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

    bankSheet
      .getRange(`A${BANK_TXN_FIRST_DATA_ROW}:${lastCol}${writeEnd}`)
      .values = allValues;

    for (const colIdx of FORMULA_COLS) {
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

    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'xeroBankTransactionsExcel.ts:done',message:'bank build complete',data:{rowCount:payoutRows.length,firstReference:payoutRows[0]?.[4]??null},timestamp:Date.now(),hypothesisId:'H3',runId:'pre-fix'})}).catch(()=>{});
    // #endregion

    return { rowCount: payoutRows.length };
  });
}
