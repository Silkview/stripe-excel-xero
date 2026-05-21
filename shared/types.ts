export interface PushRowIssue {
  date?: string;
  description?: string;
  reference?: string;
  accountCode?: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  retry_after?: number;
  details?: string[];
  rowIssues?: PushRowIssue[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface StripePayoutRow {
  payout_id: string;
  arrival_date: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  currency: string;
  status: string;
  description: string;
  bank_account_last4: string;
}

export interface StripeBalanceTransactionRow {
  transaction_id: string;
  created: string;
  available_on: string;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  type: string;
  reporting_category: string;
  description: string;
  source_id: string;
}

export interface StripeChargeRow {
  charge_id: string;
  created: string;
  amount: number;
  amount_captured: number;
  currency: string;
  status: string;
  customer_id: string;
  description: string;
  payment_method: string;
  paid: boolean;
}

export interface XeroAccount {
  Code: string;
  Name: string;
  Type: string;
  TaxType: string;
  SystemAccount?: string;
  CurrencyCode?: string;
}

export interface StripeAuthMessage {
  status: 'stripe_connected' | 'error';
  stripe_user_id?: string;
  provider?: string;
  message?: string;
}

export interface XeroAuthMessage {
  status: 'xero_connected' | 'error';
  tenantName?: string;
  provider?: string;
  message?: string;
}

export interface StripeConnectionStatus {
  connected: boolean;
  stripe_user_id?: string;
}

export interface XeroConnectionStatus {
  connected: boolean;
  tenantName?: string;
  tenantId?: string;
  /** Organisation base currency (uppercase ISO), set when Xero is connected */
  baseCurrency?: string;
}

export interface StripePullResponse<T> {
  currency: string;
  rows: T[];
  excludedByCurrency: number;
  totalBeforeCurrencyFilter: number;
}

export interface XeroAccountOption {
  Code: string;
  Name: string;
  Type: string;
  SystemAccount?: string;
  CurrencyCode?: string;
  displayLabel: string;
}

export interface XeroTaxRateOption {
  TaxType: string;
  Name: string;
  displayLabel: string;
  /** Combined tax component rate (percent), used for balance validation on push. */
  effectiveRate?: number;
}

export interface XeroTrackingCategoryOption {
  Name: string;
  Options: string[];
}

export interface XeroContactOption {
  ContactID: string;
  Name: string;
  displayLabel: string;
}

export interface XeroMappingOptions {
  accounts: XeroAccountOption[];
  taxRates: XeroTaxRateOption[];
  trackingCategories: XeroTrackingCategoryOption[];
  contacts: XeroContactOption[];
}

export type XeroManualJournalStatus = 'DRAFT' | 'POSTED';

export interface XeroJournalLineInput {
  date: string;
  accountCode: string;
  description: string;
  netAmount: number;
  taxType?: string;
  trackingName1?: string;
  trackingOption1?: string;
}

export interface ManualJournalPushRequest {
  status: XeroManualJournalStatus;
  lines: XeroJournalLineInput[];
}

export interface ManualJournalPushResult {
  created: number;
  manualJournalIds: string[];
  /** ISO date (YYYY-MM-DD) → Xero ManualJournalID */
  journalIdsByDate?: Record<string, string>;
  errors?: Array<{ date: string; message: string }>;
  rowIssues?: PushRowIssue[];
}

export interface XeroBankTransactionInput {
  date: string;
  type: string;
  contactName: string;
  bankAccountCode: string;
  reference: string;
  accountCode: string;
  amount: number;
}

export interface BankTransactionPushRequest {
  transactions: XeroBankTransactionInput[];
}

export interface BankTransactionPushResult {
  created: number;
  bankTransactionIds: string[];
  errors?: Array<{ reference: string; message: string }>;
  rowIssues?: PushRowIssue[];
}
