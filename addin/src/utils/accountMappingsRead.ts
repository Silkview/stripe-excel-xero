import type { XeroAccountOption } from '@stripesync/shared';
import { ACCOUNT_MAPPING_STRIPE_OBJECTS } from '../config/workbookSheets';
import {
  accountCodeFromInternalTaxRangeName,
  isInternalTaxRangeName,
} from './xeroAccountTaxDropdowns';

export const ACCOUNT_MAPPINGS_SHEET = 'Account_Mappings';

/** Account Mapping section data range (matches accountMappingsExcel constants). */
export const FIRST_DATA_ROW = 3;
export const LAST_DATA_ROW =
  FIRST_DATA_ROW + ACCOUNT_MAPPING_STRIPE_OBJECTS.length - 1; // 7

/** Single Contact Mapping row (Bank Transfer Contact -> Xero Contact). */
export const CONTACT_DATA_ROW = 11;

const LABEL_SEP = ' — ';

const COL_STRIPE_OBJECT = 0;
const COL_ACCOUNT = 1;
const COL_TAX = 2;

export interface AccountMappingRow {
  stripeObject: string;
  accountCode: string;
  taxType?: string;
}

export function extractMappingCode(label: unknown): string {
  if (typeof label === 'number') return String(label);
  const s = String(label ?? '').trim();
  if (!s || s === '0') return '';
  if (isInternalTaxRangeName(s)) {
    return accountCodeFromInternalTaxRangeName(s);
  }
  const idx = s.indexOf(LABEL_SEP);
  if (idx > 0) return s.slice(0, idx).trim();
  return s;
}

/** Resolve a mapping cell to the dropdown display label (Code — Name). */
export function resolveAccountDisplayLabel(
  value: unknown,
  accounts: XeroAccountOption[]
): string | null {
  const s = String(value ?? '').trim();
  if (!s || s === '0') return null;
  if (s.includes(LABEL_SEP)) return s;

  const code = isInternalTaxRangeName(s)
    ? accountCodeFromInternalTaxRangeName(s)
    : s;
  const match = accounts.find((a) => a.Code === code);
  return match?.displayLabel ?? null;
}

/** Normalize Account_Mappings column B for one row (journal vs bank pool). */
export function normalizeAccountMappingCell(
  value: unknown,
  stripeObject: string,
  journalAccounts: XeroAccountOption[],
  bankAccounts: XeroAccountOption[]
): string {
  const pool =
    stripeObject === 'stripe_payout_bank' ? bankAccounts : journalAccounts;
  const raw = String(value ?? '').trim();

  if (!raw || raw === '0') return '';

  if (isInternalTaxRangeName(raw)) {
    const code = accountCodeFromInternalTaxRangeName(raw);
    const match = pool.find((a) => a.Code === code);
    return match?.displayLabel ?? '';
  }

  if (raw.includes(LABEL_SEP)) {
    const code = raw.slice(0, raw.indexOf(LABEL_SEP)).trim();
    if (!pool.some((a) => a.Code === code)) return '';
    return raw;
  }

  const resolved = resolveAccountDisplayLabel(raw, pool);
  if (resolved) return resolved;

  const code = raw;
  if (!pool.some((a) => a.Code === code)) return '';
  return raw;
}

export function parseAccountMappingRows(rows: unknown[][]): AccountMappingRow[] {
  const result: AccountMappingRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const stripeObject = String(rows[i][COL_STRIPE_OBJECT] ?? '').trim();
    if (!stripeObject) continue;
    const accountCode = extractMappingCode(rows[i][COL_ACCOUNT]);
    const taxType = extractMappingCode(rows[i][COL_TAX]);
    result.push({
      stripeObject,
      accountCode,
      taxType: taxType || undefined,
    });
  }

  return result;
}

export function getMappingForObject(
  rows: AccountMappingRow[],
  stripeObject: string
): AccountMappingRow | undefined {
  return rows.find(
    (r) => r.stripeObject.toLowerCase() === stripeObject.toLowerCase()
  );
}

/** Account Mapping data range A1 ref (`A3:E7`). */
export function mappingDataRangeA1(): string {
  return `A${FIRST_DATA_ROW}:E${LAST_DATA_ROW}`;
}

/** Read the single Bank Transfer Contact value (B11) from the Contact Mapping section. */
export async function readBankTransferContactLabel(): Promise<string> {
  return Excel.run(async (ctx) => {
    const sheet = ctx.workbook.worksheets.getItemOrNullObject(
      ACCOUNT_MAPPINGS_SHEET
    );
    sheet.load('name');
    await ctx.sync();
    if (sheet.isNullObject) return '';
    const cell = sheet.getRange(`B${CONTACT_DATA_ROW}`);
    cell.load('values');
    await ctx.sync();
    return String((cell.values as unknown[][])[0]?.[0] ?? '').trim();
  });
}
