import { colLetter } from './officeHelpers';

/** Clear data rows (contents + formats) from firstDataRow through used range. */
export async function clearSheetDataArea(
  sheetName: string,
  firstDataRow: number,
  lastColLetter: string
): Promise<void> {
  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItemOrNullObject(sheetName);
    sheet.load('name');
    await context.sync();

    if (sheet.isNullObject) return;

    const used = sheet.getUsedRangeOrNullObject();
    used.load(['rowIndex', 'rowCount']);
    await context.sync();

    if (used.isNullObject || used.rowCount <= 1) return;

    const lastRow = used.rowIndex + used.rowCount;
    if (lastRow < firstDataRow) return;

    const range = sheet.getRange(
      `A${firstDataRow}:${lastColLetter}${lastRow}`
    );
    range.clear(Excel.ClearApplyTo.contents);
    range.clear(Excel.ClearApplyTo.formats);
    await context.sync();
  });
}

/** Clear all contents and formats in the worksheet used range (including row 1). */
export async function clearEntireSheetUsedRange(
  sheetName: string
): Promise<void> {
  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItemOrNullObject(sheetName);
    sheet.load('name');
    await context.sync();

    if (sheet.isNullObject) return;

    const used = sheet.getUsedRangeOrNullObject();
    used.load('address');
    await context.sync();

    if (used.isNullObject) return;

    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'sheetClear.ts:clearEntireSheetUsedRange',message:'clearing sheet used range',data:{sheetName,address:used.address},timestamp:Date.now(),hypothesisId:'H1',runId:'pre-fix'})}).catch(()=>{});
    // #endregion

    used.clear(Excel.ClearApplyTo.contents);
    used.clear(Excel.ClearApplyTo.formats);
    await context.sync();
  });
}

/** Clear by column count (1-based). */
export async function clearSheetDataAreaByColCount(
  sheetName: string,
  firstDataRow: number,
  colCount: number
): Promise<void> {
  return clearSheetDataArea(sheetName, firstDataRow, colLetter(colCount));
}
