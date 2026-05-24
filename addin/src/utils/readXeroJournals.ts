import type { XeroJournalLineInput } from '@stripesync/shared';
import { JOURNAL_SHEET } from '../config/xeroJournalBuilder';
import {
  ACCOUNT_MAPPINGS_SHEET,
  extractMappingCode,
  getMappingForObject,
  mappingDataRangeA1,
  parseAccountMappingRows,
} from './accountMappingsRead';
import { parseSheetRange } from './officeHelpers';

export const DEFAULT_JOURNAL_PUSH_RANGE = `${JOURNAL_SHEET}!A2:J500`;

const COL_DATE = 0;
const COL_ACCOUNT = 2;
const COL_DESCRIPTION = 3;
const COL_GROSS_AMOUNT = 4;
const COL_TAX = 5;
const COL_TRACKING_NAME = 6;
const COL_TRACKING_OPTION = 7;
const COL_XERO_ID = 8;

export interface JournalRowContext {
  excelRow: number;
  date: string;
  description: string;
  accountCode: string;
}

export interface ReadJournalsForPushResult {
  lines: XeroJournalLineInput[];
  skippedCount: number;
  rowContext: JournalRowContext[];
}

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function excelSerialToDateKey(serial: number): string {
  const epoch = Date.UTC(1899, 11, 30);
  const d = new Date(epoch + serial * 86400000);
  return formatLocalYmd(
    new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

export function normalizeJournalDate(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return excelSerialToDateKey(value);
  if (value instanceof Date) return formatLocalYmd(value);
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return formatLocalYmd(d);
  return null;
}

function isAlreadyPushed(xeroId: unknown): boolean {
  const s = String(xeroId ?? '').trim();
  if (!s) return false;
  if (s === '✓ pushed' || /pushed/i.test(s)) return true;
  return true;
}

function enrichClearingLines(
  lines: XeroJournalLineInput[],
  clearingMapping: ReturnType<typeof getMappingForObject>
): void {
  if (!clearingMapping?.accountCode) return;

  const { accountCode, taxType } = clearingMapping;

  for (const line of lines) {
    if (line.accountCode === accountCode) {
      if (!line.taxType && taxType) line.taxType = taxType;
    }
  }

  for (const line of lines) {
    if (line.accountCode) continue;
    const counterpart = lines.find(
      (other) =>
        other !== line &&
        other.date === line.date &&
        other.description === line.description &&
        other.accountCode &&
        Math.abs(other.netAmount + line.netAmount) < 0.01
    );
    if (!counterpart) continue;
    line.accountCode = accountCode;
    if (!line.taxType && taxType) line.taxType = taxType;
  }
}

function parseAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  const n = parseFloat(String(value).replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

function optionalText(value: unknown): string | undefined {
  const s = String(value ?? '').trim();
  if (!s || s === '0') return undefined;
  return s;
}

export async function readXeroJournalsForPush(
  rangeA1: string = DEFAULT_JOURNAL_PUSH_RANGE
): Promise<ReadJournalsForPushResult> {
  return await Excel.run(async (context) => {
    const parsed = parseSheetRange(rangeA1);
    const sheet = context.workbook.worksheets.getItemOrNullObject(
      parsed.sheetName
    );
    sheet.load('name');
    await context.sync();

    if (sheet.isNullObject) {
      throw new Error(
        `${parsed.sheetName} sheet not found. Run Set up workbook sheets and build journals first.`
      );
    }

    context.application.calculate(Excel.CalculationType.full);

    const endCol = Math.max(parsed.endCol, 9);
    const endColLetter = String.fromCharCode(64 + endCol);
    const range = sheet.getRange(
      `A${parsed.startRow}:${endColLetter}${parsed.endRow}`
    );
    range.load('values');
    await context.sync();

    const mappingSheet =
      context.workbook.worksheets.getItemOrNullObject(ACCOUNT_MAPPINGS_SHEET);
    mappingSheet.load('name');
    await context.sync();

    let clearingMapping: ReturnType<typeof getMappingForObject>;
    if (!mappingSheet.isNullObject) {
      const mappingRange = mappingSheet.getRange(mappingDataRangeA1());
      mappingRange.load('values');
      await context.sync();
      clearingMapping = getMappingForObject(
        parseAccountMappingRows(mappingRange.values as unknown[][]),
        'stripe_clearing'
      );
    }

    const rows = range.values as unknown[][];
    const candidates: { line: XeroJournalLineInput; excelRow: number }[] = [];
    let skippedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const excelRow = parsed.startRow + i;

      if (row.length > COL_XERO_ID && isAlreadyPushed(row[COL_XERO_ID])) {
        skippedCount += 1;
        continue;
      }

      const date = normalizeJournalDate(row[COL_DATE]);
      const accountCode = extractMappingCode(row[COL_ACCOUNT]);
      const grossAmount = parseAmount(row[COL_GROSS_AMOUNT]);

      if (!date || grossAmount === 0) continue;

      const line: XeroJournalLineInput = {
        date,
        accountCode,
        description: String(row[COL_DESCRIPTION] ?? '').trim(),
        netAmount: grossAmount,
      };

      const taxType = extractMappingCode(row[COL_TAX]);
      if (taxType) line.taxType = taxType;

      const trackingName = optionalText(row[COL_TRACKING_NAME]);
      const trackingOption = optionalText(row[COL_TRACKING_OPTION]);
      if (trackingName) line.trackingName1 = trackingName;
      if (trackingOption) line.trackingOption1 = trackingOption;

      candidates.push({ line, excelRow });
    }

    const lines = candidates.map((c) => c.line);
    enrichClearingLines(lines, clearingMapping);
    const valid = candidates.filter((c) => Boolean(c.line.accountCode));
    skippedCount += candidates.length - valid.length;

    if (valid.length === 0) {
      throw new Error(
        skippedCount > 0
          ? 'All journal lines in range are already pushed or invalid.'
          : 'No valid journal lines found (need Date, Account Code, and non-zero Gross Amount).'
      );
    }

    return {
      lines: valid.map((c) => c.line),
      skippedCount,
      rowContext: valid.map((c) => ({
        excelRow: c.excelRow,
        date: c.line.date,
        description: c.line.description,
        accountCode: c.line.accountCode,
      })),
    };
  });
}
