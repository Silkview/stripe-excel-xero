export const PAYOUT_HEADERS = [
  'payout_id',
  'arrival_date',
  'gross_amount',
  'fee_amount',
  'net_amount',
  'currency',
  'status',
  'description',
  'bank_account_last4',
];

export const BALANCE_TRANSACTION_HEADERS = [
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
];

export const CHARGE_HEADERS = [
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
];

export type StripePullObjectType =
  | 'payouts'
  | 'balance_transactions'
  | 'charges';

export const STRIPE_PULL_OBJECTS: Record<
  StripePullObjectType,
  { label: string; sheet: string; endpoint: string }
> = {
  payouts: {
    label: 'Payouts',
    sheet: 'Stripe_Payouts',
    endpoint: '/api/stripe/payouts',
  },
  balance_transactions: {
    label: 'Balance Transactions',
    sheet: 'Stripe_Balance_Transactions',
    endpoint: '/api/stripe/balance-transactions',
  },
  charges: {
    label: 'Charges',
    sheet: 'Stripe_Charges',
    endpoint: '/api/stripe/charges',
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
  'stripe_object',
  'xero_account_code',
  'xero_tax_type',
  'xero_tracking_name',
  'xero_tracking_option',
];

export interface WorkbookSheetConfig {
  name: string;
  headers: string[];
  defaultRows?: string[][];
}

export const WORKBOOK_SHEETS: WorkbookSheetConfig[] = [
  { name: 'Stripe_Payouts', headers: PAYOUT_HEADERS },
  { name: 'Stripe_Balance_Transactions', headers: BALANCE_TRANSACTION_HEADERS },
  { name: 'Stripe_Charges', headers: CHARGE_HEADERS },
  {
    name: 'Xero_Journals',
    headers: [
      'Date',
      'Narration',
      'Account Code',
      'Description',
      'Net Amount',
      'Tax Type',
      'Tracking Name 1',
      'Tracking Option 1',
    ],
  },
  {
    name: 'Xero_Bank_Transfers',
    headers: [
      'Date',
      'Type',
      'Contact',
      'Reference',
      'Account Code',
      'Amount',
      'Description',
    ],
  },
  {
    name: 'Account_Mappings',
    headers: ACCOUNT_MAPPING_HEADERS,
    defaultRows: ACCOUNT_MAPPING_STRIPE_OBJECTS.map((obj) => [obj]),
  },
];
