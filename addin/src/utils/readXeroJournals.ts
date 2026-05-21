import type { XeroJournalLineInput } from '@stripesync/shared';
import { JOURNAL_SHEET } from '../config/xeroJournalBuilder';
import {
  ACCOUNT_MAPPINGS_SHEET,
  extractMappingCode,
  getMappingForObject,
  mappingDataRangeA1,
  parseAccountMappingRows,
} from './accountMappingsRead';

const JOURNAL_FIRST_DATA_ROW = 2;
const COL_DATE = 0;
const COL_ACCOUNT = 2;
const COL_DESCRIPTION = 3;
const COL_NET_AMOUNT = 4;
const COL_TAX = 5;
const COL_TRACKING_NAME = 6;
const COL_TRACKING_OPTION = 7;

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

function extractCode(label: unknown): string {
  return extractMappingCode(label);
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

export async function readXeroJournalsForPush(): Promise<XeroJournalLineInput[]> {
  return await Excel.run(async (context) => {
    const sheet =
      context.workbook.worksheets.getItemOrNullObject(JOURNAL_SHEET);
    sheet.load('name');
    await context.sync();

    if (sheet.isNullObject) {
      throw new Error(
        `${JOURNAL_SHEET} sheet not found. Run Set up workbook sheets and build journals first.`
      );
    }

    context.application.calculate(Excel.CalculationType.full);

    const used = sheet.getUsedRangeOrNullObject();
    used.load(['rowIndex', 'rowCount']);
    await context.sync();

    if (used.isNullObject || used.rowCount <= 1) {
      throw new Error(`${JOURNAL_SHEET} has no journal lines to push.`);
    }

    let lastRow = used.rowIndex + used.rowCount;
    const probeRange = sheet.getRange(`A${JOURNAL_FIRST_DATA_ROW}:A${lastRow}`);
    probeRange.load('values');
    await context.sync();
    const probeRows = probeRange.values as unknown[][];
    let lastDataIdx = -1;
    for (let i = probeRows.length - 1; i >= 0; i--) {
      if (normalizeJournalDate(probeRows[i][0])) {
        lastDataIdx = i;
        break;
      }
    }
    if (lastDataIdx < 0) {
      throw new Error(`${JOURNAL_SHEET} has no journal lines to push.`);
    }
    lastRow = JOURNAL_FIRST_DATA_ROW + lastDataIdx;

    const range = sheet.getRange(`A${JOURNAL_FIRST_DATA_ROW}:H${lastRow}`);
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
    const lines: XeroJournalLineInput[] = [];

    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'readXeroJournals.ts:range',message:'read scope',data:{usedLastRow:used.rowIndex+used.rowCount,trimmedLastRow:lastRow,rowCount:rows.length},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const date = normalizeJournalDate(row[COL_DATE]);
      const accountCode = extractCode(row[COL_ACCOUNT]);
      const netAmount = parseAmount(row[COL_NET_AMOUNT]);

      if (!date || netAmount === 0) continue;

      const line: XeroJournalLineInput = {
        date,
        accountCode,
        description: String(row[COL_DESCRIPTION] ?? '').trim(),
        netAmount,
      };

      const taxType = extractCode(row[COL_TAX]);
      if (taxType) line.taxType = taxType;

      const trackingName = optionalText(row[COL_TRACKING_NAME]);
      const trackingOption = optionalText(row[COL_TRACKING_OPTION]);
      if (trackingName) line.trackingName1 = trackingName;
      if (trackingOption) line.trackingOption1 = trackingOption;

      lines.push(line);
    }

    enrichClearingLines(lines, clearingMapping);

    const validLines = lines.filter((l) => Boolean(l.accountCode));

    // #region agent log
    const clearingAcct = clearingMapping?.accountCode;
    const clearingLines = clearingAcct
      ? validLines.filter((l) => l.accountCode === clearingAcct)
      : [];
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'readXeroJournals.ts:clearingEnrich',message:'clearing mapping applied',data:{clearingAccount:clearingAcct,clearingTax:clearingMapping?.taxType,clearingLineCount:clearingLines.length,clearingWithTax:clearingLines.filter(l=>l.taxType).length,clearingSample:clearingLines.slice(0,2).map(l=>({acct:l.accountCode,tax:l.taxType??'(none)',amt:l.netAmount}))},timestamp:Date.now(),hypothesisId:'H-TAX-CLEAR'})}).catch(()=>{});
    // #endregion

    // #region agent log
    const byDate = new Map<string, { count: number; sum: number }>();
    for (const l of validLines) {
      const g = byDate.get(l.date) ?? { count: 0, sum: 0 };
      g.count += 1;
      g.sum += l.netAmount;
      byDate.set(l.date, g);
    }
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'readXeroJournals.ts:done',message:'lines read for push',data:{lineCount:validLines.length,skippedNoAccount:lines.length-validLines.length,byDate:Object.fromEntries(byDate)},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
    // #endregion

    if (validLines.length === 0) {
      throw new Error(
        'No valid journal lines found (need Date, Account Code, and non-zero Net Amount).'
      );
    }

    return validLines;
  });
}
