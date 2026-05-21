export const BT_SHEET = 'Stripe_Balance_Transactions';
export const MAPPING_SHEET = 'Account_Mappings';
export const JOURNAL_SHEET = 'Xero_Journals';

export const BT_COL_CREATED = 'B';
export const BT_COL_AMOUNT = 'D';
export const BT_COL_FEE = 'E';
export const BT_COL_TYPE = 'H';

export const MAPPING_RANGE_A = '$A$2:$A$6';
export const MAPPING_FIRST_ROW = 2;
export const MAPPING_LAST_ROW = 6;

export const JOURNAL_CLEAR_ROWS = 500;

export type JournalDescriptionKind = 'Charges' | 'Refunds' | 'Fees';
export type BalanceTxnType = 'charge' | 'refund';

export type MappingField = 'account' | 'tax' | 'trackingName' | 'trackingOption';

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
    return `=IF(${indexExpr}=0,"",${indexExpr})`;
  }
  return `=${indexExpr}`;
}

export function sumifsAmount(
  type: BalanceTxnType,
  dateCellRef: string,
  lastRow: number,
  clearing = false
): string {
  const sign = clearing ? '' : '-';
  return `=${sign}SUMIFS(${btRange(BT_COL_AMOUNT, lastRow)},${btRange(BT_COL_TYPE, lastRow)},"${type}",${btRange(BT_COL_CREATED, lastRow)},${dateCellRef})`;
}

/** Fee line uses SUMIFS; clearing pair uses negative SUMIFS on column E. */
export function sumifsFee(
  dateCellRef: string,
  lastRow: number,
  clearing = false
): string {
  if (clearing) {
    return `=-SUMIFS(${btRange(BT_COL_FEE, lastRow)},${btRange(BT_COL_CREATED, lastRow)},${dateCellRef})`;
  }
  return `=SUMIFS(${btRange(BT_COL_FEE, lastRow)},${btRange(BT_COL_CREATED, lastRow)},${dateCellRef})`;
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
