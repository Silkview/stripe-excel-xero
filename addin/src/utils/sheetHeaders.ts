import { colLetter } from './officeHelpers';

export type HeaderIndexMap = Map<string, number>;

export function normalizeHeaderLabel(label: string): string {
  return String(label ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Build 0-based column index map from row-1 header labels. */
export function buildHeaderIndex(headers: readonly unknown[]): HeaderIndexMap {
  const map: HeaderIndexMap = new Map();
  headers.forEach((raw, index) => {
    const norm = normalizeHeaderLabel(String(raw ?? ''));
    if (!norm || map.has(norm)) return;
    map.set(norm, index);
  });
  return map;
}

export function columnIndex(
  map: HeaderIndexMap,
  ...labels: string[]
): number {
  for (const label of labels) {
    const idx = map.get(normalizeHeaderLabel(label));
    if (idx !== undefined) return idx;
  }
  throw new Error(
    `Column not found (${labels.join(' / ')}). Check sheet headers in row 1.`
  );
}

export function optionalColumnIndex(
  map: HeaderIndexMap,
  ...labels: string[]
): number | undefined {
  for (const label of labels) {
    const idx = map.get(normalizeHeaderLabel(label));
    if (idx !== undefined) return idx;
  }
  return undefined;
}

export function columnLetterForHeader(
  map: HeaderIndexMap,
  ...labels: string[]
): string {
  return colLetter(columnIndex(map, ...labels) + 1);
}

export function rowValue(row: unknown[], index: number | undefined): unknown {
  if (index === undefined || index < 0 || index >= row.length) return undefined;
  return row[index];
}

export interface SheetTableData {
  headers: string[];
  headerIndex: HeaderIndexMap;
  rows: unknown[][];
  lastRow: number;
  lastColLetter: string;
}

/** Load header row + data rows from a worksheet used range. */
export async function loadSheetTable(
  sheet: Excel.Worksheet,
  firstDataRow: number,
  context: Excel.RequestContext
): Promise<SheetTableData | null> {
  const used = sheet.getUsedRangeOrNullObject();
  used.load(['rowIndex', 'rowCount', 'columnIndex', 'columnCount']);
  await context.sync();

  if (used.isNullObject || used.rowCount < 1) {
    return null;
  }

  const lastRow = used.rowIndex + used.rowCount;
  const lastColLetter = colLetter(used.columnIndex + used.columnCount);
  const headerRange = sheet.getRange(`A1:${lastColLetter}1`);
  headerRange.load('values');
  await context.sync();

  const headers = (headerRange.values[0] ?? []).map((h) => String(h ?? ''));

  if (lastRow < firstDataRow) {
    return {
      headers,
      headerIndex: buildHeaderIndex(headers),
      rows: [],
      lastRow,
      lastColLetter,
    };
  }

  const dataRange = sheet.getRange(`A${firstDataRow}:${lastColLetter}${lastRow}`);
  dataRange.load('values');
  await context.sync();

  return {
    headers,
    headerIndex: buildHeaderIndex(headers),
    rows: dataRange.values as unknown[][],
    lastRow,
    lastColLetter,
  };
}

/** Load header row column index map from row 1. */
export async function loadSheetHeaderIndex(
  sheet: Excel.Worksheet,
  context: Excel.RequestContext
): Promise<HeaderIndexMap> {
  const used = sheet.getUsedRangeOrNullObject();
  used.load(['columnIndex', 'columnCount']);
  await context.sync();

  if (used.isNullObject || used.columnCount < 1) {
    return new Map();
  }

  const lastColLetter = colLetter(used.columnIndex + used.columnCount);
  const headerRange = sheet.getRange(`A1:${lastColLetter}1`);
  headerRange.load('values');
  await context.sync();

  return buildHeaderIndex(headerRange.values[0] ?? []);
}
