const HEADER_ACRONYMS: Record<string, string> = {
  id: 'ID',
};

export const STRIPE_ACCOUNT_HEADER_KEYS = [
  'stripe_account_id',
  'stripe_account_name',
] as const;

export const PAYOUT_HEADER_KEYS = [
  'payout_id',
  'arrival_date',
  'gross_amount',
  'fee_amount',
  'net_amount',
  'currency',
  'status',
  'description',
  'bank_account_last4',
] as const;

export const BALANCE_TRANSACTION_HEADER_KEYS = [
  'transaction_id',
  'created',
  'available_on',
  'amount',
  'fee',
  'net',
  'currency',
  'type',
  'reporting_category',
  'description',
  'source_id',
] as const;

export const PAYOUT_BALANCE_TRANSACTION_HEADER_KEYS = [
  'payout_id',
  'payout_arrival_date',
  'payout_gross_amount',
  'payout_fee_amount',
  'payout_net_amount',
  'payout_currency',
  'payout_status',
  'payout_description',
  'payout_bank_account_last4',
  'transaction_id',
  'created',
  'available_on',
  'amount',
  'fee',
  'net',
  'currency',
  'type',
  'reporting_category',
  'description',
  'source_id',
] as const;

export const CHARGE_HEADER_KEYS = [
  'charge_id',
  'created',
  'amount',
  'amount_captured',
  'currency',
  'status',
  'customer_id',
  'description',
  'payment_method',
  'paid',
] as const;

export const PAYOUT_SHEET_KEYS = [
  ...STRIPE_ACCOUNT_HEADER_KEYS,
  ...PAYOUT_HEADER_KEYS,
] as const;

export const BALANCE_TRANSACTION_SHEET_KEYS = [
  ...STRIPE_ACCOUNT_HEADER_KEYS,
  ...BALANCE_TRANSACTION_HEADER_KEYS,
] as const;

export const PAYOUT_BALANCE_TRANSACTION_SHEET_KEYS = [
  ...STRIPE_ACCOUNT_HEADER_KEYS,
  ...PAYOUT_BALANCE_TRANSACTION_HEADER_KEYS,
] as const;

export const CHARGE_SHEET_KEYS = [
  ...STRIPE_ACCOUNT_HEADER_KEYS,
  ...CHARGE_HEADER_KEYS,
] as const;

/** @deprecated Use STRIPE_ACCOUNT_HEADER_KEYS */
export const STRIPE_ACCOUNT_HEADERS = [...STRIPE_ACCOUNT_HEADER_KEYS];

/** @deprecated Use display headers from getStripeSheetDisplayHeaders */
export const PAYOUT_HEADERS = [...PAYOUT_HEADER_KEYS];
export const BALANCE_TRANSACTION_HEADERS = [...BALANCE_TRANSACTION_HEADER_KEYS];
export const PAYOUT_BALANCE_TRANSACTION_HEADERS = [
  ...PAYOUT_BALANCE_TRANSACTION_HEADER_KEYS,
];
export const CHARGE_HEADERS = [...CHARGE_HEADER_KEYS];

export function toStripeDisplayHeader(key: string): string {
  return key
    .split('_')
    .map((part) => {
      const lower = part.toLowerCase();
      if (HEADER_ACRONYMS[lower]) return HEADER_ACRONYMS[lower];
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function getStripeSheetDisplayHeaders(
  keys: readonly string[]
): string[] {
  return keys.map(toStripeDisplayHeader);
}

export const PAYOUT_SHEET_DISPLAY_HEADERS =
  getStripeSheetDisplayHeaders(PAYOUT_SHEET_KEYS);
export const BALANCE_TRANSACTION_SHEET_DISPLAY_HEADERS =
  getStripeSheetDisplayHeaders(BALANCE_TRANSACTION_SHEET_KEYS);
export const PAYOUT_BALANCE_TRANSACTION_SHEET_DISPLAY_HEADERS =
  getStripeSheetDisplayHeaders(PAYOUT_BALANCE_TRANSACTION_SHEET_KEYS);
export const CHARGE_SHEET_DISPLAY_HEADERS =
  getStripeSheetDisplayHeaders(CHARGE_SHEET_KEYS);

export type StripePullObjectType =
  | 'payouts'
  | 'balance_transactions'
  | 'balance_trx_payouts'
  | 'charges';

export const STRIPE_PULL_OBJECTS: Record<
  StripePullObjectType,
  {
    label: string;
    sheet: string;
    endpoint: string;
    sheetKeys: readonly string[];
    displayHeaders: string[];
  }
> = {
  payouts: {
    label: 'Payouts',
    sheet: 'Stripe_Payouts',
    endpoint: '/api/stripe/payouts',
    sheetKeys: PAYOUT_SHEET_KEYS,
    displayHeaders: PAYOUT_SHEET_DISPLAY_HEADERS,
  },
  balance_transactions: {
    label: 'Balance Transactions',
    sheet: 'Stripe_Balance_Transactions',
    endpoint: '/api/stripe/balance-transactions',
    sheetKeys: BALANCE_TRANSACTION_SHEET_KEYS,
    displayHeaders: BALANCE_TRANSACTION_SHEET_DISPLAY_HEADERS,
  },
  balance_trx_payouts: {
    label: 'Balance Transaction Payouts',
    sheet: 'Stripe_Balance_Trx_Payouts',
    endpoint: '/api/stripe/balance-trx-payouts',
    sheetKeys: PAYOUT_BALANCE_TRANSACTION_SHEET_KEYS,
    displayHeaders: PAYOUT_BALANCE_TRANSACTION_SHEET_DISPLAY_HEADERS,
  },
  charges: {
    label: 'Charges',
    sheet: 'Stripe_Charges',
    endpoint: '/api/stripe/charges',
    sheetKeys: CHARGE_SHEET_KEYS,
    displayHeaders: CHARGE_SHEET_DISPLAY_HEADERS,
  },
};

export const ACCOUNT_MAPPING_STRIPE_OBJECTS = [
  'charge',
  'refund',
  'fee',
  'stripe_clearing',
  'stripe_payout_bank',
] as const;

export const ACCOUNT_MAPPING_HEADERS = [
  'Stripe Object',
  'Xero Account Code',
  'Xero Tax Type',
  'Xero Tracking Name',
  'Xero Tracking Option',
] as const;

export const CONTACT_MAPPING_KEYS = ['stripe_payout_contact'] as const;

export type ContactMappingKey = (typeof CONTACT_MAPPING_KEYS)[number];

export const CONTACT_MAPPING_LABELS: Record<ContactMappingKey, string> = {
  stripe_payout_contact: 'Bank Transfer Contact',
};

export const CONTACT_MAPPING_HEADERS = ['', 'Xero Contact'] as const;

export interface WorkbookSheetConfig {
  name: string;
  headers: string[];
  defaultRows?: string[][];
}

export const WORKBOOK_SHEETS: WorkbookSheetConfig[] = [
  { name: 'Stripe_Payouts', headers: PAYOUT_SHEET_DISPLAY_HEADERS },
  {
    name: 'Stripe_Balance_Transactions',
    headers: BALANCE_TRANSACTION_SHEET_DISPLAY_HEADERS,
  },
  {
    name: 'Stripe_Balance_Trx_Payouts',
    headers: PAYOUT_BALANCE_TRANSACTION_SHEET_DISPLAY_HEADERS,
  },
  { name: 'Stripe_Charges', headers: CHARGE_SHEET_DISPLAY_HEADERS },
  {
    name: 'Xero_Journals',
    headers: [
      'Date',
      'Narration',
      'Account Code',
      'Description',
      'Gross Amount',
      'Tax Type',
      'Tracking Name 1',
      'Tracking Option 1',
      'Xero ID',
      'Status',
    ],
  },
  {
    name: 'Xero_Bank_Transaction',
    headers: [
      'Date',
      'Type',
      'Contact',
      'Bank Account',
      'Reference',
      'Account Code',
      'Amount',
      'Xero ID',
      'Status',
    ],
  },
  {
    name: 'Account_Mappings',
    headers: [...ACCOUNT_MAPPING_HEADERS],
  },
];
