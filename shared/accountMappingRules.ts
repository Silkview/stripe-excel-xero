/** Account fields used for mapping dropdown and push validation. */
export interface XeroAccountForMapping {
  Type: string;
  SystemAccount?: string;
  CurrencyCode?: string;
}

const PAYOUT_BANK_TYPE = 'BANK';

/** Types that must not be used on charge/refund/fee/clearing rows. */
const JOURNAL_EXCLUDED_TYPES = new Set(['BANK', 'GST', 'DEBTOR', 'DEBTORS']);

/** System accounts that must not be used on journal mapping rows. */
const JOURNAL_EXCLUDED_SYSTEM = new Set(['DEBTORS', 'DEBTOR', 'GST']);

export function isBankPayoutAccount(
  account: XeroAccountForMapping,
  defaultCurrency?: string
): boolean {
  if ((account.Type || '').toUpperCase() !== PAYOUT_BANK_TYPE) return false;
  if (!defaultCurrency) return true;
  const acctCur = (account.CurrencyCode || '').trim().toUpperCase();
  const target = defaultCurrency.trim().toUpperCase();
  if (!acctCur) return true;
  return acctCur === target;
}

export function isJournalMappingAccount(account: XeroAccountForMapping): boolean {
  const type = (account.Type || '').toUpperCase();
  if (JOURNAL_EXCLUDED_TYPES.has(type)) return false;

  const system = (account.SystemAccount || '').toUpperCase();
  if (!system) return true;
  if (JOURNAL_EXCLUDED_SYSTEM.has(system)) return false;
  if (system.startsWith('GST')) return false;

  return true;
}

export function journalAccountExclusionReason(
  account: XeroAccountForMapping
): string | undefined {
  if (isJournalMappingAccount(account)) return undefined;
  const type = (account.Type || '').toUpperCase();
  if (type === 'BANK') return 'Bank accounts cannot be used here (use stripe_payout_bank row).';
  if (JOURNAL_EXCLUDED_TYPES.has(type)) {
    return `${type} accounts cannot be used on this mapping row.`;
  }
  const system = account.SystemAccount || '';
  if (system) {
    return `System account "${system}" cannot be used on this mapping row.`;
  }
  return 'This account type is not allowed on this mapping row.';
}
