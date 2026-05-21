export { BT_SHEET, MAPPING_SHEET, mappingFormula } from './xeroJournalBuilder';

export const BANK_TXN_SHEET = 'Xero_Bank_Transaction';

export const BANK_TXN_TYPE_RECEIVE = 'RECEIVE';

export const MAPPING_STRIPE_PAYOUT_CONTACT = 'stripe_payout_contact';
export const MAPPING_STRIPE_PAYOUT_BANK = 'stripe_payout_bank';
export const MAPPING_STRIPE_CLEARING = 'stripe_clearing';

export const BANK_TXN_CLEAR_ROWS = 500;

/** BT column indices (0-based) aligned with BALANCE_TRANSACTION_HEADERS. */
export const BT_IDX_AVAILABLE_ON = 2;
export const BT_IDX_AMOUNT = 3;
export const BT_IDX_CURRENCY = 6;
export const BT_IDX_TYPE = 7;
export const BT_IDX_SOURCE_ID = 10;

/** Legacy sheet names from earlier setup. */
export const BANK_TXN_SHEET_ALIASES = [
  'Xero_Bank_Transaction',
  'Xero_Bank_Transactions',
  'Xero_Bank_Transfers',
] as const;
