import { WORKBOOK_SHEETS } from '../config/workbookSheets';
import { writeAccountMappingsLayout } from './accountMappingsExcel';
import { clearEntireSheetUsedRange } from './sheetClear';

const ACCOUNT_MAPPINGS_SHEET_NAME = 'Account_Mappings';

export interface SetupSheetsResult {
  created: string[];
  skipped: string[];
}

export function colLetter(colCount: number): string {
  let letter = '';
  let n = colCount;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

export async function writeDataToSheet(
  sheetName: string,
  _startCell: string,
  data: unknown[][],
  headers: string[]
): Promise<void> {
  const lastCol = colLetter(headers.length);
  await clearEntireSheetUsedRange(sheetName);

  await Excel.run(async (context) => {
    let sheet = context.workbook.worksheets.getItemOrNullObject(sheetName);
    await context.sync();

    if (sheet.isNullObject) {
      sheet = context.workbook.worksheets.add(sheetName);
    }

    const headerRange = sheet.getRange(`A1:${lastCol}1`);
    headerRange.values = [headers];
    headerRange.format.font.bold = true;
    headerRange.format.fill.color = '#F0F0F0';

    if (data.length > 0) {
      const dataRange = sheet.getRange(
        `A2:${lastCol}${data.length + 1}`
      );
      dataRange.values = data;
    }

    sheet.getUsedRange().format.autofitColumns();
    await context.sync();
  });
}

/** Activate a worksheet and select a cell so Excel shows the updated sheet. */
export async function activateWorksheet(
  sheetName: string,
  focusCell = 'A1'
): Promise<void> {
  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItemOrNullObject(sheetName);
    sheet.load('name');
    await context.sync();
    if (sheet.isNullObject) return;
    sheet.activate();
    sheet.getRange(focusCell).select();
    await context.sync();
  });
}

/** Activate the first worksheet that exists from the given names. */
export async function activateFirstAvailableWorksheet(
  sheetNames: readonly string[],
  focusCell = 'A1'
): Promise<void> {
  await Excel.run(async (context) => {
    for (const name of sheetNames) {
      const sheet = context.workbook.worksheets.getItemOrNullObject(name);
      sheet.load('name');
      await context.sync();
      if (!sheet.isNullObject) {
        sheet.activate();
        sheet.getRange(focusCell).select();
        await context.sync();
        return;
      }
    }
  });
}

export async function readRangeValues(rangeAddress: string): Promise<unknown[][]> {
  return await Excel.run(async (context) => {
    const range = context.workbook.worksheets
      .getActiveWorksheet()
      .getRange(rangeAddress);
    range.load('values');
    await context.sync();
    return range.values as unknown[][];
  });
}

export async function writeStatusToCell(
  sheetName: string,
  row: number,
  col: string,
  value: string
): Promise<void> {
  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem(sheetName);
    sheet.getRange(`${col}${row}`).values = [[value]];
    await context.sync();
  });
}

export async function setupWorkbookSheets(): Promise<SetupSheetsResult> {
  const result: SetupSheetsResult = { created: [], skipped: [] };

  await Excel.run(async (context) => {
    let nextPosition = 0;

    for (const config of WORKBOOK_SHEETS) {
      const existing = context.workbook.worksheets.getItemOrNullObject(config.name);
      existing.load('name');
      await context.sync();

      if (!existing.isNullObject) {
        result.skipped.push(config.name);
        continue;
      }

      const sheet = context.workbook.worksheets.add(config.name);
      sheet.position = nextPosition;
      nextPosition += 1;

      if (config.name === ACCOUNT_MAPPINGS_SHEET_NAME) {
        writeAccountMappingsLayout(sheet);
      } else {
        const lastCol = colLetter(config.headers.length);
        const headerRange = sheet.getRange(`A1:${lastCol}1`);
        headerRange.values = [config.headers];
        headerRange.format.font.bold = true;
        headerRange.format.fill.color = '#F0F0F0';

        if (config.defaultRows && config.defaultRows.length > 0) {
          const dataRange = sheet.getRange(
            `A2:A${config.defaultRows.length + 1}`
          );
          dataRange.values = config.defaultRows;
        }

        sheet.getUsedRange().format.autofitColumns();
      }

      result.created.push(config.name);
    }

    await context.sync();
  });

  return result;
}

export function parseDestination(destination: string): {
  sheetName: string;
  startCell: string;
} {
  const parts = destination.split('!');
  if (parts.length >= 2) {
    return {
      sheetName: parts[0].replace(/^'|'$/g, ''),
      startCell: parts[1] || 'A1',
    };
  }
  return { sheetName: destination || 'Stripe_Payouts', startCell: 'A1' };
}

export interface ParsedSheetRange {
  sheetName: string;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

function parseCellRef(ref: string): { col: number; row: number } {
  const match = ref.match(/^(\$?)([A-Za-z]+)(\$?)(\d+)$/);
  if (!match) return { col: 1, row: 1 };
  const letters = match[2].toUpperCase();
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return { col, row: parseInt(match[4], 10) };
}

/** Parse A1-style range e.g. Xero_Journals!A2:I200 */
export function parseSheetRange(rangeA1: string): ParsedSheetRange {
  const trimmed = rangeA1.trim();
  const bang = trimmed.indexOf('!');
  const sheetPart = bang >= 0 ? trimmed.slice(0, bang) : trimmed;
  const rangePart = bang >= 0 ? trimmed.slice(bang + 1) : 'A1';
  const sheetName = sheetPart.replace(/^'|'$/g, '');

  const cells = rangePart.split(':');
  const start = parseCellRef(cells[0] || 'A1');
  const end = parseCellRef(cells[1] || cells[0] || 'A1');

  return {
    sheetName,
    startRow: Math.min(start.row, end.row),
    endRow: Math.max(start.row, end.row),
    startCol: Math.min(start.col, end.col),
    endCol: Math.max(start.col, end.col),
  };
}
