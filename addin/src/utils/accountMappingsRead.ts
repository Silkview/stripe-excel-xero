import type { XeroAccountOption } from '@stripesync/shared';
import {
  ACCOUNT_MAPPING_HEADERS,
  ACCOUNT_MAPPING_STRIPE_OBJECTS,
} from '../config/workbookSheets';
import {
  accountCodeFromInternalTaxRangeName,
  isInternalTaxRangeName,
} from './xeroAccountTaxDropdowns';

export const ACCOUNT_MAPPINGS_SHEET = 'Account_Mappings';
const FIRST_DATA_ROW = 2;

const LABEL_SEP = ' — ';

const COL_STRIPE_OBJECT = 0;
const COL_ACCOUNT = 1;
const COL_TAX = 2;
const COL_CONTACT = 5;

export interface AccountMappingRow {
  stripeObject: string;
  accountCode: string;
  taxType?: string;
  contactLabel?: string;
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

export function parseAccountMappingRows(rows: unknown[][]): AccountMappingRow[] {
  const result: AccountMappingRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const stripeObject = String(rows[i][COL_STRIPE_OBJECT] ?? '').trim();
    if (!stripeObject) continue;
    const accountCode = extractMappingCode(rows[i][COL_ACCOUNT]);
    const taxType = extractMappingCode(rows[i][COL_TAX]);
    const contactLabel = String(rows[i][COL_CONTACT] ?? '').trim();
    result.push({
      stripeObject,
      accountCode,
      taxType: taxType || undefined,
      contactLabel: contactLabel || undefined,
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

export function mappingDataRangeA1(): string {
  const lastRow = FIRST_DATA_ROW + ACCOUNT_MAPPING_STRIPE_OBJECTS.length - 1;
  const lastCol = String.fromCharCode(64 + ACCOUNT_MAPPING_HEADERS.length);
  return `A${FIRST_DATA_ROW}:${lastCol}${lastRow}`;
}
