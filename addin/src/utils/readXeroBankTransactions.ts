import type { XeroBankTransactionInput } from '@stripesync/shared';
import {
  BANK_TXN_SHEET,
  BANK_TXN_SHEET_ALIASES,
} from '../config/xeroBankTransactionBuilder';
import { extractMappingCode } from './accountMappingsRead';
import { parseSheetRange } from './officeHelpers';
import { normalizeJournalDate } from './readXeroJournals';

export const DEFAULT_BANK_PUSH_RANGE = `${BANK_TXN_SHEET}!A2:H500`;

const COL_DATE = 0;
const COL_TYPE = 1;
const COL_CONTACT = 2;
const COL_BANK_ACCOUNT = 3;
const COL_REFERENCE = 4;
const COL_ACCOUNT_CODE = 5;
const COL_AMOUNT = 6;
const COL_XERO_ID = 7;

export interface ReadBankTransactionsForPushResult {
  transactions: XeroBankTransactionInput[];
  skippedCount: number;
  includedRowNumbers: number[];
}

function parseAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  const n = parseFloat(String(value).replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

function contactName(value: unknown): string {
  const s = String(value ?? '').trim();
  if (!s || s === '0') return '';
  return s;
}

function isAlreadyPushed(xeroId: unknown): boolean {
  const s = String(xeroId ?? '').trim();
  if (!s) return false;
  if (s === '✓ pushed' || /pushed/i.test(s)) return true;
  return true;
}

async function resolveBankTransactionSheet(
  context: Excel.RequestContext,
  preferredName: string
): Promise<Excel.Worksheet> {
  const tryNames = [
    preferredName,
    ...BANK_TXN_SHEET_ALIASES.filter((n) => n !== preferredName),
  ];
  for (const name of tryNames) {
    const sheet = context.workbook.worksheets.getItemOrNullObject(name);
    sheet.load('name');
    await context.sync();
    if (!sheet.isNullObject) {
      return sheet;
    }
  }
  throw new Error(
    `${BANK_TXN_SHEET} sheet not found. Run Set up workbook sheets and build bank transactions first.`
  );
}

export async function readXeroBankTransactionsForPush(
  rangeA1: string = DEFAULT_BANK_PUSH_RANGE
): Promise<ReadBankTransactionsForPushResult> {
  return await Excel.run(async (context) => {
    const parsed = parseSheetRange(rangeA1);
    const sheet = await resolveBankTransactionSheet(context, parsed.sheetName);

    context.application.calculate(Excel.CalculationType.full);

    const endCol = Math.max(parsed.endCol, 8);
    const endColLetter = String.fromCharCode(64 + endCol);
    const range = sheet.getRange(
      `A${parsed.startRow}:${endColLetter}${parsed.endRow}`
    );
    range.load('values');
    await context.sync();

    const rows = range.values as unknown[][];
    const transactions: XeroBankTransactionInput[] = [];
    const includedRowNumbers: number[] = [];
    let skippedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const excelRow = parsed.startRow + i;

      if (row.length > COL_XERO_ID && isAlreadyPushed(row[COL_XERO_ID])) {
        skippedCount += 1;
        continue;
      }

      const date = normalizeJournalDate(row[COL_DATE]);
      const type = String(row[COL_TYPE] ?? '').trim();
      const contact = contactName(row[COL_CONTACT]);
      const bankAccountCode = extractMappingCode(row[COL_BANK_ACCOUNT]);
      const accountCode = extractMappingCode(row[COL_ACCOUNT_CODE]);
      const amount = parseAmount(row[COL_AMOUNT]);

      if (
        !date ||
        !contact ||
        !bankAccountCode ||
        !accountCode ||
        amount === 0
      ) {
        continue;
      }

      transactions.push({
        date,
        type,
        contactName: contact,
        bankAccountCode,
        reference: String(row[COL_REFERENCE] ?? '').trim(),
        accountCode,
        amount,
      });
      includedRowNumbers.push(excelRow);
    }

    if (transactions.length === 0) {
      throw new Error(
        skippedCount > 0
          ? 'All bank transactions in range are already pushed or invalid.'
          : 'No valid bank transactions found (need Date, Type RECEIVE, Contact, Bank Account, Account Code, and non-zero Amount).'
      );
    }

    return { transactions, skippedCount, includedRowNumbers };
  });
}
