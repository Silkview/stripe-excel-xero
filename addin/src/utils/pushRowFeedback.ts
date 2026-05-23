import { parseSheetRange, colLetter } from './officeHelpers';
import type { RowFeedback } from './mapPushRowIssues';

const FILL_ERROR = '#FFE5E5';
const FILL_OK = '#E8F8F1';

export async function resetPushFeedback(
  rangeA1: string,
  statusCol: string,
  dataColCount: number
): Promise<void> {
  const parsed = parseSheetRange(rangeA1);
  const lastCol = colLetter(dataColCount);

  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem(parsed.sheetName);
    const range = sheet.getRange(
      `A${parsed.startRow}:${lastCol}${parsed.endRow}`
    );
    range.format.fill.clear();
    const statusRange = sheet.getRange(
      `${statusCol}${parsed.startRow}:${statusCol}${parsed.endRow}`
    );
    statusRange.clear(Excel.ClearApplyTo.contents);
    await context.sync();
  });
}

export async function applyPushRowFeedback(
  rangeA1: string,
  statusCol: string,
  dataColCount: number,
  feedback: RowFeedback[]
): Promise<void> {
  if (feedback.length === 0) return;

  const parsed = parseSheetRange(rangeA1);
  const lastCol = colLetter(dataColCount);

  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem(parsed.sheetName);

    for (const row of feedback) {
      const dataRange = sheet.getRange(`A${row.excelRow}:${lastCol}${row.excelRow}`);
      dataRange.format.fill.color =
        row.status === 'error' ? FILL_ERROR : FILL_OK;

      if (row.message) {
        sheet.getRange(`${statusCol}${row.excelRow}`).values = [[row.message]];
      }
    }

    await context.sync();
  });
}

export const JOURNAL_PUSH_DATA_COLS = 9;
export const JOURNAL_PUSH_STATUS_COL = 'I';
export const BANK_PUSH_DATA_COLS = 8;
export const BANK_PUSH_STATUS_COL = 'H';
