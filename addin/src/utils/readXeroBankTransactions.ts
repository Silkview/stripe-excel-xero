import type { XeroBankTransactionInput } from '@stripesync/shared';
import {
  BANK_TXN_SHEET,
  BANK_TXN_SHEET_ALIASES,
} from '../config/xeroBankTransactionBuilder';
import { extractMappingCode } from './accountMappingsRead';
import { parseSheetRange } from './officeHelpers';
import { normalizeJournalDate } from './readXeroJournals';
import {
  columnIndex,
  loadSheetHeaderIndex,
  rowValue,
} from './sheetHeaders';

export const DEFAULT_BANK_PUSH_RANGE = `${BANK_TXN_SHEET}!A2:I500`;

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

    const headerIndex = await loadSheetHeaderIndex(sheet, context);
    const colDate = columnIndex(headerIndex, 'Date');
    const colType = columnIndex(headerIndex, 'Type');
    const colContact = columnIndex(headerIndex, 'Contact');
    const colBankAccount = columnIndex(headerIndex, 'Bank Account');
    const colReference = columnIndex(headerIndex, 'Reference');
    const colAccountCode = columnIndex(headerIndex, 'Account Code');
    const colAmount = columnIndex(headerIndex, 'Amount');
    const colXeroId = columnIndex(headerIndex, 'Xero ID');

    const endCol = Math.max(parsed.endCol, colXeroId + 1);
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

      if (isAlreadyPushed(rowValue(row, colXeroId))) {
        skippedCount += 1;
        continue;
      }

      const date = normalizeJournalDate(rowValue(row, colDate));
      const type = String(rowValue(row, colType) ?? '').trim();
      const contact = contactName(rowValue(row, colContact));
      const bankAccountCode = extractMappingCode(rowValue(row, colBankAccount));
      const accountCode = extractMappingCode(rowValue(row, colAccountCode));
      const amount = parseAmount(rowValue(row, colAmount));

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
        reference: String(rowValue(row, colReference) ?? '').trim(),
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
