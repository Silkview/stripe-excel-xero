import axios, { AxiosError } from 'axios';
import {
  isBankPayoutAccount,
  isJournalMappingAccount,
  journalAccountExclusionReason,
} from '@stripesync/shared/accountMappingRules';
import type {
  BankTransactionPushResult,
  ManualJournalPushResult,
  PushRowIssue,
  XeroAccount,
  XeroAccountOption,
  XeroBankTransactionInput,
  XeroJournalLineInput,
  XeroManualJournalStatus,
  XeroContactOption,
  XeroMappingOptions,
  XeroTaxRateOption,
  XeroTrackingCategoryOption,
} from '@stripesync/shared';
import {
  getXeroConnection,
  saveXeroConnection,
  type XeroTokens,
} from '../connections/store';
import { REQUEST_TIMEOUT_MS } from '../api-response';

const XERO_IDENTITY = 'https://identity.xero.com/connect/token';
const XERO_API = 'https://api.xero.com';

export class XeroServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfter?: number,
    public details?: string[],
    public rowIssues?: PushRowIssue[]
  ) {
    super(message);
  }
}

const BALANCE_EPSILON = 0.01;

export async function exchangeXeroCode(
  code: string,
  codeVerifier: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  try {
    const response = await axios.post(
      XERO_IDENTITY,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.XERO_CLIENT_ID || '',
        client_secret: process.env.XERO_CLIENT_SECRET || '',
        redirect_uri: process.env.XERO_REDIRECT_URI || '',
        code,
        code_verifier: codeVerifier,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );
    return response.data;
  } catch (err) {
    throw mapXeroError(err);
  }
}

export async function getOrganisationBaseCurrency(
  accessToken: string,
  tenantId: string
): Promise<string> {
  try {
    const response = await axios.get(`${XERO_API}/api.xro/2.0/Organisation`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Xero-tenant-id': tenantId,
        Accept: 'application/json',
      },
      timeout: REQUEST_TIMEOUT_MS,
    });
    const base = response.data?.Organisations?.[0]?.BaseCurrency;
    if (!base || typeof base !== 'string') {
      throw new XeroServiceError(
        'XERO_ERROR',
        'Could not read base currency from Xero organisation.'
      );
    }
    return base.toUpperCase();
  } catch (err) {
    if (err instanceof XeroServiceError) throw err;
    throw mapXeroError(err);
  }
}

export async function ensureXeroBaseCurrency(
  workspaceId: string
): Promise<string> {
  const xero = await ensureValidToken(workspaceId);
  if (xero.baseCurrency) return xero.baseCurrency;

  const baseCurrency = await getOrganisationBaseCurrency(
    xero.access_token,
    xero.tenantId
  );
  await saveXeroConnection(workspaceId, { ...xero, baseCurrency });
  return baseCurrency;
}

export async function getWorkspaceDefaultCurrency(
  workspaceId: string
): Promise<string> {
  const xero = await getXeroConnection(workspaceId);
  if (!xero) {
    throw new XeroServiceError(
      'XERO_AUTH_REQUIRED',
      'Connect Xero to set your posting currency.'
    );
  }
  if (!xero.baseCurrency) {
    throw new XeroServiceError(
      'VALIDATION_ERROR',
      'Posting currency is not set. Reconnect Xero or refresh the connection.'
    );
  }
  return xero.baseCurrency;
}

export async function fetchXeroConnections(
  accessToken: string
): Promise<Array<{ tenantId: string; tenantName: string }>> {
  try {
    const response = await axios.get(`${XERO_API}/connections`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return (response.data || []).map(
      (c: { tenantId: string; tenantName: string }) => ({
        tenantId: c.tenantId,
        tenantName: c.tenantName,
      })
    );
  } catch (err) {
    throw mapXeroError(err);
  }
}

export async function ensureValidToken(workspaceId: string): Promise<XeroTokens> {
  const xero = await getXeroConnection(workspaceId);
  if (!xero) {
    throw new XeroServiceError(
      'XERO_AUTH_REQUIRED',
      'Xero is not connected. Please connect your Xero account.'
    );
  }

  if (Date.now() < xero.expires_at - 60_000) {
    return xero;
  }

  try {
    const response = await axios.post(
      XERO_IDENTITY,
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.XERO_CLIENT_ID || '',
        client_secret: process.env.XERO_CLIENT_SECRET || '',
        refresh_token: xero.refresh_token,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    const updated: XeroTokens = {
      ...xero,
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token || xero.refresh_token,
      expires_at: Date.now() + response.data.expires_in * 1000,
    };
    await saveXeroConnection(workspaceId, updated);
    return updated;
  } catch {
    throw new XeroServiceError(
      'XERO_AUTH_REQUIRED',
      'Your Xero connection has expired. Please reconnect.'
    );
  }
}

function xeroHeaders(xero: XeroTokens): Record<string, string> {
  return {
    Authorization: `Bearer ${xero.access_token}`,
    'Xero-tenant-id': xero.tenantId,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

async function xeroGet<T>(workspaceId: string, path: string): Promise<T> {
  const xero = await ensureValidToken(workspaceId);
  const response = await axios.get(`${XERO_API}${path}`, {
    headers: xeroHeaders(xero),
    timeout: REQUEST_TIMEOUT_MS,
  });
  return response.data as T;
}

async function xeroPost<T>(
  workspaceId: string,
  path: string,
  body: unknown
): Promise<T> {
  const xero = await ensureValidToken(workspaceId);
  const response = await axios.post(`${XERO_API}${path}`, body, {
    headers: xeroHeaders(xero),
    timeout: REQUEST_TIMEOUT_MS,
  });
  return response.data as T;
}

const JOURNAL_NARRATION_PREFIX = 'Stripe posting - ';
const BANK_TXN_DESCRIPTION_PREFIX = 'Stripe Payout - ';
const MANUAL_JOURNAL_CHUNK = 50;
const BANK_TRANSACTION_CHUNK = 50;

function formatDateDdMmYyyy(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

function buildJournalLine(line: XeroJournalLineInput): Record<string, unknown> {
  const journalLine: Record<string, unknown> = {
    LineAmount: line.netAmount,
    AccountCode: line.accountCode,
    Description: line.description || '',
  };
  if (line.taxType) {
    journalLine.TaxType = line.taxType;
  }
  if (line.trackingName1 && line.trackingOption1) {
    journalLine.Tracking = [
      { Name: line.trackingName1, Option: line.trackingOption1 },
    ];
  }
  return journalLine;
}

function groupLinesByDate(
  lines: XeroJournalLineInput[]
): Map<string, XeroJournalLineInput[]> {
  const groups = new Map<string, XeroJournalLineInput[]>();
  for (const line of lines) {
    const list = groups.get(line.date) ?? [];
    list.push(line);
    groups.set(line.date, list);
  }
  return groups;
}

function categorizeXeroMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes('accountcode') ||
    lower.includes('account code') ||
    (lower.includes('account') && lower.includes('invalid'))
  ) {
    return `Invalid account code: ${raw}`;
  }
  if (lower.includes('taxtype') || lower.includes('tax type')) {
    return `Invalid tax type: ${raw}`;
  }
  if (lower.includes('tracking')) {
    return `Invalid tracking name or option: ${raw}`;
  }
  if (lower.includes('balance') || lower.includes('not balance')) {
    return `Journal is unbalanced: ${raw}`;
  }
  return raw;
}

function parseXeroManualJournalErrors(data: unknown): string[] {
  const details: string[] = [];
  if (!data || typeof data !== 'object') return details;

  const topMessage = (data as { Message?: string }).Message;
  if (topMessage) details.push(categorizeXeroMessage(topMessage));

  const elements = (data as { Elements?: unknown[] }).Elements;
  if (!Array.isArray(elements)) return details;

  for (const el of elements) {
    if (!el || typeof el !== 'object') continue;
    const record = el as {
      Date?: string;
      Narration?: string;
      ValidationErrors?: Array<{ Message?: string }>;
      JournalLines?: Array<{
        ValidationErrors?: Array<{ Message?: string }>;
        Description?: string;
      }>;
    };

    const context = [record.Date, record.Narration].filter(Boolean).join(' — ');
    const prefix = context ? `${context}: ` : '';

    if (Array.isArray(record.ValidationErrors)) {
      for (const e of record.ValidationErrors) {
        if (e.Message) details.push(prefix + categorizeXeroMessage(e.Message));
      }
    }

    if (Array.isArray(record.JournalLines)) {
      for (const line of record.JournalLines) {
        const lineDesc = line.Description ? `"${line.Description}"` : 'line';
        if (Array.isArray(line.ValidationErrors)) {
          for (const e of line.ValidationErrors) {
            if (e.Message) {
              details.push(
                `${prefix}${lineDesc}: ${categorizeXeroMessage(e.Message)}`
              );
            }
          }
        }
      }
    }
  }

  return [...new Set(details)];
}

function validationErrorFromRowIssues(
  rowIssues: PushRowIssue[],
  sheetHint: string
): never {
  const details = rowIssues.map((i) => i.message);
  const summary = `Found ${rowIssues.length} validation issue${rowIssues.length === 1 ? '' : 's'}. Fix ${sheetHint}, then push again.`;
  throw new XeroServiceError(
    'VALIDATION_ERROR',
    summary,
    undefined,
    details,
    rowIssues
  );
}

async function collectManualJournalValidationIssues(
  workspaceId: string,
  lines: XeroJournalLineInput[],
  _defaultCurrency: string
): Promise<PushRowIssue[]> {
  const options = await getMappingOptions(workspaceId);
  const accountByCode = new Map(
    options.accounts.map((a) => [a.Code, a] as const)
  );
  const validTaxTypes = new Set(options.taxRates.map((t) => t.TaxType));
  const trackingOptions = new Map<string, Set<string>>();
  for (const cat of options.trackingCategories) {
    trackingOptions.set(cat.Name, new Set(cat.Options));
  }

  const groups = groupLinesByDate(lines);
  const rowIssues: PushRowIssue[] = [];

  for (const [date, groupLines] of groups) {
    const total = groupLines.reduce((sum, l) => sum + l.netAmount, 0);
    if (Math.abs(total) > BALANCE_EPSILON) {
      rowIssues.push({
        date,
        message: `Journal is unbalanced (total ${total.toFixed(2)}). Line amounts must sum to zero (Inclusive).`,
      });
    }

    for (const line of groupLines) {
      const mappedAccount = accountByCode.get(line.accountCode);
      if (!mappedAccount) {
        rowIssues.push({
          date,
          description: line.description,
          accountCode: line.accountCode,
          message: `Invalid account code "${line.accountCode}".`,
        });
      } else if (!isJournalMappingAccount(mappedAccount)) {
        const reason =
          journalAccountExclusionReason(mappedAccount) ??
          'This account cannot be used on journal lines.';
        rowIssues.push({
          date,
          description: line.description,
          accountCode: line.accountCode,
          message: reason,
        });
      }

      if (line.taxType && !validTaxTypes.has(line.taxType)) {
        rowIssues.push({
          date,
          description: line.description,
          accountCode: line.accountCode,
          message: `Invalid tax type "${line.taxType}".`,
        });
      }

      const hasName = Boolean(line.trackingName1?.trim());
      const hasOption = Boolean(line.trackingOption1?.trim());
      if (hasName !== hasOption) {
        rowIssues.push({
          date,
          accountCode: line.accountCode,
          message: `Tracking requires both category and option (account ${line.accountCode}).`,
        });
      } else if (hasName && hasOption) {
        const optionsForCat = trackingOptions.get(line.trackingName1!);
        if (!optionsForCat) {
          rowIssues.push({
            date,
            accountCode: line.accountCode,
            message: `Invalid tracking — category "${line.trackingName1}" not found in Xero.`,
          });
        } else if (!optionsForCat.has(line.trackingOption1!)) {
          rowIssues.push({
            date,
            accountCode: line.accountCode,
            message: `Invalid tracking — option "${line.trackingOption1}" not found for category "${line.trackingName1}".`,
          });
        }
      }
    }
  }

  return rowIssues;
}

export async function pushManualJournals(
  workspaceId: string,
  status: XeroManualJournalStatus,
  lines: XeroJournalLineInput[]
): Promise<ManualJournalPushResult> {
  await ensureValidToken(workspaceId);
  const defaultCurrency = await getWorkspaceDefaultCurrency(workspaceId);
  const validationIssues = await collectManualJournalValidationIssues(
    workspaceId,
    lines,
    defaultCurrency
  );
  if (validationIssues.length > 0) {
    validationErrorFromRowIssues(
      validationIssues,
      'Xero_Journals and Account_Mappings'
    );
  }

  const groups = groupLinesByDate(lines);
  const sortedDates = [...groups.keys()].sort();
  const manualJournals = sortedDates.map((date) => {
    const journalLines = groups.get(date) ?? [];
    const payload = {
      Date: date,
      Narration: `${JOURNAL_NARRATION_PREFIX}${formatDateDdMmYyyy(date)}`,
      Status: status,
      LineAmountTypes: 'Inclusive',
      CurrencyCode: defaultCurrency,
      JournalLines: journalLines.map(buildJournalLine),
    };
    return payload;
  });

  const manualJournalIds: string[] = [];
  const journalIdsByDate: Record<string, string> = {};
  const errors: Array<{ date: string; message: string }> = [];
  const rowIssues: PushRowIssue[] = [];

  for (let i = 0; i < manualJournals.length; i += MANUAL_JOURNAL_CHUNK) {
    const chunk = manualJournals.slice(i, i + MANUAL_JOURNAL_CHUNK);
    try {
      const data = await xeroPost<{
        ManualJournals?: Array<{ ManualJournalID?: string }>;
      }>(workspaceId, '/api.xro/2.0/ManualJournals', { ManualJournals: chunk });

      const created = data.ManualJournals ?? [];
      for (let j = 0; j < created.length; j++) {
        const mj = created[j];
        const date = chunk[j]?.Date;
        if (mj.ManualJournalID) {
          manualJournalIds.push(mj.ManualJournalID);
          if (date) journalIdsByDate[date] = mj.ManualJournalID;
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const parsed = parseXeroManualJournalErrors(err.response.data);
        const dates = chunk.map((c) => c.Date).join(', ');
        const fallback =
          'Xero rejected the journal. Check account codes, tax types, and tracking in Account_Mappings.';
        const message = parsed.length > 0 ? parsed.join('; ') : fallback;
        errors.push({ date: dates, message });
        for (const journal of chunk) {
          if (journal.Date) {
            rowIssues.push({ date: journal.Date, message });
          }
        }
        if (err.response.status === 400) {
          continue;
        }
      }
      throw mapXeroError(err);
    }
  }

  return {
    created: manualJournalIds.length,
    manualJournalIds,
    journalIdsByDate,
    errors: errors.length > 0 ? errors : undefined,
    rowIssues: rowIssues.length > 0 ? rowIssues : undefined,
  };
}

function resolveXeroContact(
  contactName: string,
  contacts: XeroContactOption[]
): Record<string, string> {
  const trimmed = contactName.trim();
  const match = contacts.find(
    (c) => c.Name === trimmed || c.displayLabel === trimmed
  );
  if (match) return { ContactID: match.ContactID };
  return { Name: trimmed };
}

function buildBankTransactionPayload(
  line: XeroBankTransactionInput,
  contacts: XeroContactOption[]
): Record<string, unknown> {
  const lineAmount = Math.abs(line.amount);
  return {
    Type: 'RECEIVE',
    Status: 'AUTHORISED',
    Contact: resolveXeroContact(line.contactName, contacts),
    Date: line.date,
    Reference: line.reference || '',
    BankAccount: { Code: line.bankAccountCode },
    LineItems: [
      {
        Description: `${BANK_TXN_DESCRIPTION_PREFIX}${formatDateDdMmYyyy(line.date)}`,
        LineAmount: lineAmount,
        AccountCode: line.accountCode,
      },
    ],
  };
}

function parseXeroBankTransactionErrors(data: unknown): string[] {
  const details: string[] = [];
  if (!data || typeof data !== 'object') return details;

  const topMessage = (data as { Message?: string }).Message;
  if (topMessage) details.push(categorizeXeroMessage(topMessage));

  const elements = (data as { Elements?: unknown[] }).Elements;
  if (!Array.isArray(elements)) return details;

  for (const el of elements) {
    if (!el || typeof el !== 'object') continue;
    const record = el as {
      Reference?: string;
      Date?: string;
      ValidationErrors?: Array<{ Message?: string }>;
      LineItems?: Array<{
        ValidationErrors?: Array<{ Message?: string }>;
        Description?: string;
      }>;
    };

    const context = [record.Date, record.Reference].filter(Boolean).join(' — ');
    const prefix = context ? `${context}: ` : '';

    if (Array.isArray(record.ValidationErrors)) {
      for (const e of record.ValidationErrors) {
        if (e.Message) details.push(prefix + categorizeXeroMessage(e.Message));
      }
    }

    if (Array.isArray(record.LineItems)) {
      for (const item of record.LineItems) {
        const itemDesc = item.Description ? `"${item.Description}"` : 'line';
        if (Array.isArray(item.ValidationErrors)) {
          for (const e of item.ValidationErrors) {
            if (e.Message) {
              details.push(
                `${prefix}${itemDesc}: ${categorizeXeroMessage(e.Message)}`
              );
            }
          }
        }
      }
    }
  }

  return [...new Set(details)];
}

function contactMatches(
  contactName: string,
  contacts: XeroContactOption[]
): boolean {
  const trimmed = contactName.trim();
  return contacts.some(
    (c) => c.Name === trimmed || c.displayLabel === trimmed
  );
}

async function collectBankTransactionValidationIssues(
  workspaceId: string,
  lines: XeroBankTransactionInput[],
  defaultCurrency: string
): Promise<PushRowIssue[]> {
  const options = await getMappingOptions(workspaceId);
  const accountByCode = new Map(
    options.accounts.map((a) => [a.Code, a] as const)
  );
  const rowIssues: PushRowIssue[] = [];

  for (const line of lines) {
    if (line.type.toUpperCase() !== 'RECEIVE') {
      rowIssues.push({
        date: line.date,
        reference: line.reference,
        message: `Type must be RECEIVE (got "${line.type}").`,
      });
    }

    if (!contactMatches(line.contactName, options.contacts)) {
      rowIssues.push({
        date: line.date,
        reference: line.reference,
        message: `Invalid contact "${line.contactName}". Choose a contact from Account_Mappings (stripe_payout_contact).`,
      });
    }

    const bankAccount = accountByCode.get(line.bankAccountCode);
    if (!bankAccount) {
      rowIssues.push({
        date: line.date,
        reference: line.reference,
        message: `Invalid bank account code "${line.bankAccountCode}".`,
      });
    } else if (!isBankPayoutAccount(bankAccount, defaultCurrency)) {
      const acctCur = (bankAccount.CurrencyCode || '').trim();
      rowIssues.push({
        date: line.date,
        reference: line.reference,
        message: acctCur
          ? `Bank account "${line.bankAccountCode}" must be a BANK account in ${defaultCurrency} (account is ${acctCur}).`
          : `Bank account "${line.bankAccountCode}" must be a BANK account in ${defaultCurrency}.`,
      });
    }

    const lineAccount = accountByCode.get(line.accountCode);
    if (!lineAccount) {
      rowIssues.push({
        date: line.date,
        reference: line.reference,
        message: `Invalid account code "${line.accountCode}".`,
      });
    } else if (!isJournalMappingAccount(lineAccount)) {
      const reason =
        journalAccountExclusionReason(lineAccount) ??
        'This account cannot be used on the line item.';
      rowIssues.push({
        date: line.date,
        reference: line.reference,
        message: reason,
      });
    }

    if (line.amount === 0) {
      rowIssues.push({
        date: line.date,
        reference: line.reference,
        message: 'Amount must be non-zero.',
      });
    }
  }

  return rowIssues;
}

export async function pushBankTransactions(
  workspaceId: string,
  lines: XeroBankTransactionInput[]
): Promise<BankTransactionPushResult> {
  await ensureValidToken(workspaceId);
  const defaultCurrency = await getWorkspaceDefaultCurrency(workspaceId);
  const validationIssues = await collectBankTransactionValidationIssues(
    workspaceId,
    lines,
    defaultCurrency
  );
  if (validationIssues.length > 0) {
    validationErrorFromRowIssues(
      validationIssues,
      'Xero_Bank_Transaction and Account_Mappings'
    );
  }

  const options = await getMappingOptions(workspaceId);
  const bankTransactions = lines.map((line) =>
    buildBankTransactionPayload(line, options.contacts)
  );

  const bankTransactionIds: string[] = [];
  const errors: Array<{ reference: string; message: string }> = [];
  const rowIssues: PushRowIssue[] = [];

  for (let i = 0; i < bankTransactions.length; i += BANK_TRANSACTION_CHUNK) {
    const chunk = bankTransactions.slice(i, i + BANK_TRANSACTION_CHUNK);
    const chunkLines = lines.slice(i, i + BANK_TRANSACTION_CHUNK);
    try {
      const data = await xeroPost<{
        BankTransactions?: Array<{ BankTransactionID?: string }>;
      }>(workspaceId, '/api.xro/2.0/BankTransactions', {
        BankTransactions: chunk,
      });

      const created = data.BankTransactions ?? [];
      for (let j = 0; j < created.length; j++) {
        const bt = created[j];
        if (bt.BankTransactionID) bankTransactionIds.push(bt.BankTransactionID);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const parsed = parseXeroBankTransactionErrors(err.response.data);
        const refs = chunkLines.map((l) => l.reference || l.date).join(', ');
        const fallback =
          'Xero rejected the bank transaction. Check contact, bank account, and account codes in Account_Mappings.';
        const message = parsed.length > 0 ? parsed.join('; ') : fallback;
        errors.push({ reference: refs, message });
        for (const line of chunkLines) {
          rowIssues.push({
            date: line.date,
            reference: line.reference,
            message,
          });
        }
        if (err.response.status === 400) {
          continue;
        }
      }
      throw mapXeroError(err);
    }
  }

  return {
    created: bankTransactionIds.length,
    bankTransactionIds,
    errors: errors.length > 0 ? errors : undefined,
    rowIssues: rowIssues.length > 0 ? rowIssues : undefined,
  };
}

export async function getAccounts(workspaceId: string): Promise<XeroAccount[]> {
  const xero = await ensureValidToken(workspaceId);

  try {
    const response = await axios.get(`${XERO_API}/api.xro/2.0/Accounts`, {
      headers: {
        Authorization: `Bearer ${xero.access_token}`,
        'Xero-tenant-id': xero.tenantId,
        Accept: 'application/json',
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    const accounts = response.data?.Accounts ?? [];
    return accounts
      .filter(
        (a: { Status?: string }) =>
          (a.Status || 'ACTIVE').toUpperCase() !== 'ARCHIVED'
      )
      .map(
        (a: {
          Code: string;
          Name: string;
          Type: string;
          TaxType: string;
          SystemAccount?: string;
          CurrencyCode?: string;
        }) => ({
          Code: a.Code,
          Name: a.Name,
          Type: a.Type,
          TaxType: a.TaxType || '',
          SystemAccount: a.SystemAccount || undefined,
          CurrencyCode: a.CurrencyCode || undefined,
        })
      );
  } catch (err) {
    throw mapXeroError(err);
  }
}

export async function getTaxRates(workspaceId: string): Promise<XeroTaxRateOption[]> {
  try {
    const data = await xeroGet<{
      TaxRates?: Array<{
        TaxType: string;
        Name: string;
        TaxComponents?: Array<{ Rate?: number }>;
      }>;
    }>(workspaceId, '/api.xro/2.0/TaxRates');
    const seen = new Set<string>();
    const rates: XeroTaxRateOption[] = [];
    for (const t of data.TaxRates ?? []) {
      if (!t.TaxType || seen.has(t.TaxType)) continue;
      seen.add(t.TaxType);
      const effectiveRate = (t.TaxComponents ?? []).reduce(
        (sum, c) => sum + (c.Rate ?? 0),
        0
      );
      rates.push({
        TaxType: t.TaxType,
        Name: t.Name || t.TaxType,
        displayLabel: `${t.TaxType} — ${t.Name || t.TaxType}`,
        effectiveRate,
      });
    }
    rates.sort((a, b) => a.TaxType.localeCompare(b.TaxType));
    return rates;
  } catch (err) {
    throw mapXeroError(err);
  }
}

export async function getTrackingCategories(
  workspaceId: string
): Promise<XeroTrackingCategoryOption[]> {
  try {
    const data = await xeroGet<{
      TrackingCategories?: Array<{
        Name: string;
        Options?: Array<{ Name: string; Status?: string }>;
      }>;
    }>(workspaceId, '/api.xro/2.0/TrackingCategories');
    return (data.TrackingCategories ?? [])
      .filter((c) => c.Name)
      .map((c) => ({
        Name: c.Name,
        Options: (c.Options ?? [])
          .filter((o) => o.Name && o.Status !== 'ARCHIVED')
          .map((o) => o.Name),
      }));
  } catch (err) {
    throw mapXeroError(err);
  }
}

export async function getContacts(
  workspaceId: string
): Promise<XeroContactOption[]> {
  try {
    const data = await xeroGet<{
      Contacts?: Array<{
        ContactID?: string;
        Name?: string;
        ContactStatus?: string;
      }>;
    }>(workspaceId, '/api.xro/2.0/Contacts');
    const contacts: XeroContactOption[] = [];
    for (const c of data.Contacts ?? []) {
      if (!c.ContactID || !c.Name) continue;
      if ((c.ContactStatus || 'ACTIVE').toUpperCase() === 'ARCHIVED') continue;
      contacts.push({
        ContactID: c.ContactID,
        Name: c.Name,
        displayLabel: c.Name,
      });
    }
    contacts.sort((a, b) => a.Name.localeCompare(b.Name));
    return contacts;
  } catch (err) {
    throw mapXeroError(err);
  }
}

export async function getMappingOptions(
  workspaceId: string
): Promise<XeroMappingOptions> {
  const [accounts, taxRates, trackingCategories, contacts] = await Promise.all([
    getAccounts(workspaceId),
    getTaxRates(workspaceId),
    getTrackingCategories(workspaceId),
    getContacts(workspaceId),
  ]);

  const accountOptions: XeroAccountOption[] = accounts.map((a) => ({
    Code: a.Code,
    Name: a.Name,
    Type: a.Type,
    SystemAccount: a.SystemAccount,
    CurrencyCode: a.CurrencyCode,
    displayLabel: `${a.Code} — ${a.Name}`,
  }));

  return { accounts: accountOptions, taxRates, trackingCategories, contacts };
}

function mapXeroError(err: unknown): XeroServiceError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError;
    if (axiosErr.code === 'ECONNABORTED') {
      return new XeroServiceError('TIMEOUT', 'The request timed out. Please try again.');
    }
    if (axiosErr.response?.status === 429) {
      const retryAfter = parseInt(
        axiosErr.response.headers['retry-after'] as string,
        10
      );
      return new XeroServiceError(
        'RATE_LIMITED',
        'Xero rate limit reached. Please wait and try again.',
        retryAfter
      );
    }
    if (axiosErr.response?.status === 401 || axiosErr.response?.status === 403) {
      return new XeroServiceError(
        'XERO_AUTH_REQUIRED',
        'Your Xero connection has expired or the organisation was disconnected. Please reconnect.'
      );
    }
  }
  return new XeroServiceError(
    'XERO_ERROR',
    'Something went wrong connecting to Xero. Please try again.'
  );
}
