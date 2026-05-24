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
  billingUrl?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export type PlanCode = 'free' | 'pro' | 'firm';

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

/** Payout fields merged with linked balance transaction(s) for one sheet row. */
export interface StripePayoutBalanceTransactionRow {
  payout_id: string;
  payout_arrival_date: string;
  payout_gross_amount: number;
  payout_fee_amount: number;
  payout_net_amount: number;
  payout_currency: string;
  payout_status: string;
  payout_description: string;
  payout_bank_account_last4: string;
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

export type XeroConnectionStatusValue =
  | 'connected'
  | 'reconnect_required'
  | 'disconnected';

export interface StripeConnectionItem {
  id: string;
  stripeAccountId: string;
  displayName: string | null;
  isDefault?: boolean;
}

export interface StripeConnectionStatus {
  connected: boolean;
  stripe_user_id?: string;
  defaultStripeAccountId?: string;
  connections?: StripeConnectionItem[];
}

export interface XeroConnectionStatus {
  connected: boolean;
  status?: XeroConnectionStatusValue;
  tenantName?: string;
  tenantId?: string;
  /** Organisation base currency (uppercase ISO), set when Xero is connected */
  baseCurrency?: string;
  refreshErrorCode?: string | null;
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
  /** Default tax code configured on the account in Xero. */
  TaxType?: string;
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
