import { WORKBOOK_SHEETS } from '../config/workbookSheets';

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
  await Excel.run(async (context) => {
    let sheet = context.workbook.worksheets.getItemOrNullObject(sheetName);
    await context.sync();

    if (sheet.isNullObject) {
      sheet = context.workbook.worksheets.add(sheetName);
    }

    const lastCol = colLetter(headers.length);
    const headerRange = sheet.getRange(`A1:${lastCol}1`);
    headerRange.values = [headers];
    headerRange.format.font.bold = true;
    headerRange.format.fill.color = '#F0F0F0';

    if (data.length > 0) {
      const dataRange = sheet.getRange(
        `A2:${lastCol}${data.length + 1}`
      );
      dataRange.values = data;
    } else {
      const clearRange = sheet.getRange(`A2:${lastCol}1000`);
      clearRange.clear(Excel.ClearApplyTo.contents);
    }

    sheet.getUsedRange().format.autofitColumns();
    await context.sync();
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
