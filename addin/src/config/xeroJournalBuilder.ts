import { ACCOUNT_MAPPING_STRIPE_OBJECTS } from './workbookSheets';

export const BT_SHEET = 'Stripe_Balance_Transactions';
export const MAPPING_SHEET = 'Account_Mappings';
export const JOURNAL_SHEET = 'Xero_Journals';

export const BT_COL_CREATED = 'D';
export const BT_COL_AMOUNT = 'F';
export const BT_COL_FEE = 'G';
export const BT_COL_TYPE = 'J';

export interface BtColumnLetters {
  created: string;
  amount: string;
  fee: string;
  type: string;
}

/** Account Mapping section: rows 3..(3 + n - 1) on Account_Mappings. */
export const MAPPING_FIRST_ROW = 3;
export const MAPPING_LAST_ROW =
  MAPPING_FIRST_ROW + ACCOUNT_MAPPING_STRIPE_OBJECTS.length - 1;
export const MAPPING_RANGE_A = `$A$${MAPPING_FIRST_ROW}:$A$${MAPPING_LAST_ROW}`;

/** Single Bank Transfer Contact cell in the Contact Mapping section (B11). */
export const CONTACT_MAPPING_DATA_ROW = 11;
export const CONTACT_MAPPING_VALUE_CELL = `$B$${CONTACT_MAPPING_DATA_ROW}`;

export const JOURNAL_CLEAR_ROWS = 500;

export type JournalDescriptionKind = 'Charges' | 'Refunds' | 'Fees';
export type BalanceTxnType = 'charge' | 'refund';

export type MappingField =
  | 'account'
  | 'tax'
  | 'trackingName'
  | 'trackingOption';

const MAPPING_COL: Record<MappingField, string> = {
  account: 'B',
  tax: 'C',
  trackingName: 'D',
  trackingOption: 'E',
};

function quoteSheet(name: string): string {
  return `'${name.replace(/'/g, "''")}'`;
}

export function btRange(col: string, lastRow: number): string {
  return `${quoteSheet(BT_SHEET)}!$${col}$${MAPPING_FIRST_ROW}:$${col}$${lastRow}`;
}

const BLANK_ON_ZERO_FIELDS: MappingField[] = [
  'tax',
  'trackingName',
  'trackingOption',
];

export function mappingFormula(
  field: MappingField,
  stripeObject: string
): string {
  const col = MAPPING_COL[field];
  const indexExpr = `INDEX(${MAPPING_SHEET}!$${col}$${MAPPING_FIRST_ROW}:$${col}$${MAPPING_LAST_ROW},MATCH("${stripeObject}",${MAPPING_SHEET}!${MAPPING_RANGE_A},0))`;
  if (BLANK_ON_ZERO_FIELDS.includes(field)) {
    return `=IF(OR(${indexExpr}="",${indexExpr}=0),"",${indexExpr})`;
  }
  return `=${indexExpr}`;
}

/**
 * Formula for the single Bank Transfer Contact cell in the Contact Mapping
 * section. Returns a direct reference to `Account_Mappings!$B$11`.
 */
export function bankTransferContactFormula(): string {
  return `=${MAPPING_SHEET}!${CONTACT_MAPPING_VALUE_CELL}`;
}

export function sumifsAmount(
  type: BalanceTxnType,
  dateCellRef: string,
  lastRow: number,
  cols: BtColumnLetters,
  clearing = false
): string {
  const sign = clearing ? '' : '-';
  return `=${sign}SUMIFS(${btRange(cols.amount, lastRow)},${btRange(cols.type, lastRow)},"${type}",${btRange(cols.created, lastRow)},${dateCellRef})`;
}

/** Fee line uses SUMIFS; clearing pair uses negative SUMIFS on fee column. */
export function sumifsFee(
  dateCellRef: string,
  lastRow: number,
  cols: BtColumnLetters,
  clearing = false
): string {
  if (clearing) {
    return `=-SUMIFS(${btRange(cols.fee, lastRow)},${btRange(cols.created, lastRow)},${dateCellRef})`;
  }
  return `=SUMIFS(${btRange(cols.fee, lastRow)},${btRange(cols.created, lastRow)},${dateCellRef})`;
}

export function descriptionFormula(
  kind: JournalDescriptionKind,
  dateCellRef: string
): string {
  return `="Stripe - ${kind} - "&TEXT(${dateCellRef},"dd/mm/yyyy")`;
}

export function journalDateCellRef(row: number): string {
  return `$A$${row}`;
}

/** Journal header narration: Stripe posting - [date] (grouped per date on push). */
export function narrationFormula(row: number): string {
  return `="Stripe posting - "&TEXT($A$${row},"dd/mm/yyyy")`;
}

export const JOURNAL_NARRATION_PREFIX = 'Stripe posting - ';
