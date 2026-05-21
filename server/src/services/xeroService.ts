import axios, { AxiosError } from 'axios';
import {
  isJournalMappingAccount,
  journalAccountExclusionReason,
} from '@stripesync/shared/accountMappingRules';
import type {
  ManualJournalPushResult,
  XeroAccount,
  XeroAccountOption,
  XeroJournalLineInput,
  XeroManualJournalStatus,
  XeroMappingOptions,
  XeroTaxRateOption,
  XeroTrackingCategoryOption,
} from '@stripesync/shared';
import { tokenStore, XeroTokens } from '../tokenStore';
import { debugLog } from '../utils/debugLog';
import { REQUEST_TIMEOUT_MS } from '../utils/response';

const XERO_IDENTITY = 'https://identity.xero.com/connect/token';
const XERO_API = 'https://api.xero.com';

export class XeroServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfter?: number,
    public details?: string[]
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

export async function ensureValidToken(sessionId: string): Promise<XeroTokens> {
  const xero = tokenStore.getXero(sessionId);
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
    tokenStore.setXero(sessionId, updated);
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

async function xeroGet<T>(sessionId: string, path: string): Promise<T> {
  const xero = await ensureValidToken(sessionId);
  const response = await axios.get(`${XERO_API}${path}`, {
    headers: xeroHeaders(xero),
    timeout: REQUEST_TIMEOUT_MS,
  });
  return response.data as T;
}

async function xeroPost<T>(
  sessionId: string,
  path: string,
  body: unknown
): Promise<T> {
  const xero = await ensureValidToken(sessionId);
  const response = await axios.post(`${XERO_API}${path}`, body, {
    headers: xeroHeaders(xero),
    timeout: REQUEST_TIMEOUT_MS,
  });
  return response.data as T;
}

const JOURNAL_NARRATION_PREFIX = 'Stripe posting - ';
const MANUAL_JOURNAL_CHUNK = 50;

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

function throwValidationIssues(issues: string[]): never {
  const summary = `Found ${issues.length} validation issue${issues.length === 1 ? '' : 's'}. Fix Xero_Journals and Account_Mappings, then push again.`;
  throw new XeroServiceError('VALIDATION_ERROR', summary, undefined, issues);
}

async function validateManualJournalLines(
  sessionId: string,
  lines: XeroJournalLineInput[]
): Promise<void> {
  const options = await getMappingOptions(sessionId);
  const accountByCode = new Map(
    options.accounts.map((a) => [a.Code, a] as const)
  );
  const validTaxTypes = new Set(options.taxRates.map((t) => t.TaxType));
  const trackingOptions = new Map<string, Set<string>>();
  for (const cat of options.trackingCategories) {
    trackingOptions.set(cat.Name, new Set(cat.Options));
  }

  const groups = groupLinesByDate(lines);
  const issues: string[] = [];

  for (const [date, groupLines] of groups) {
    const total = groupLines.reduce((sum, l) => sum + l.netAmount, 0);
    const debits = groupLines
      .filter((l) => l.netAmount > 0)
      .reduce((s, l) => s + l.netAmount, 0);
    const credits = groupLines
      .filter((l) => l.netAmount < 0)
      .reduce((s, l) => s + l.netAmount, 0);
    const withTax = groupLines.filter((l) => l.taxType).length;
    // #region agent log
    debugLog(
      'xeroService.ts:validateManualJournalLines',
      'per-date group before push',
      {
        date,
        lineCount: groupLines.length,
        total,
        debits,
        credits,
        withTax,
        descriptions: groupLines.map((l) => ({
          amt: l.netAmount,
          desc: l.description?.slice(0, 40),
          acct: l.accountCode,
        })),
      },
      'H1-H3-H5'
    );
    // #endregion
    if (Math.abs(total) > BALANCE_EPSILON) {
      issues.push(
        `${date}: Journal is unbalanced (total ${total.toFixed(2)}). Line amounts must sum to zero (Inclusive).`
      );
    }

    for (const line of groupLines) {
      const lineRef = line.description
        ? `${date}, line "${line.description}"`
        : `${date}, account ${line.accountCode}`;

      const mappedAccount = accountByCode.get(line.accountCode);
      if (!mappedAccount) {
        issues.push(
          `${lineRef}: Invalid account code "${line.accountCode}".`
        );
      } else if (!isJournalMappingAccount(mappedAccount)) {
        const reason =
          journalAccountExclusionReason(mappedAccount) ??
          'This account cannot be used on journal lines.';
        issues.push(`${lineRef}: ${reason}`);
      }

      if (line.taxType && !validTaxTypes.has(line.taxType)) {
        issues.push(`${lineRef}: Invalid tax type "${line.taxType}".`);
      }

      const hasName = Boolean(line.trackingName1?.trim());
      const hasOption = Boolean(line.trackingOption1?.trim());
      if (hasName !== hasOption) {
        issues.push(
          `${date}: Tracking requires both category and option (account ${line.accountCode}).`
        );
      } else if (hasName && hasOption) {
        const optionsForCat = trackingOptions.get(line.trackingName1!);
        if (!optionsForCat) {
          issues.push(
            `${date}: Invalid tracking — category "${line.trackingName1}" not found in Xero.`
          );
        } else if (!optionsForCat.has(line.trackingOption1!)) {
          issues.push(
            `${date}: Invalid tracking — option "${line.trackingOption1}" not found for category "${line.trackingName1}".`
          );
        }
      }
    }
  }

  if (issues.length > 0) throwValidationIssues(issues);
}

export async function pushManualJournals(
  sessionId: string,
  status: XeroManualJournalStatus,
  lines: XeroJournalLineInput[]
): Promise<ManualJournalPushResult> {
  await ensureValidToken(sessionId);
  await validateManualJournalLines(sessionId, lines);

  const groups = groupLinesByDate(lines);
  const sortedDates = [...groups.keys()].sort();
  const manualJournals = sortedDates.map((date) => {
    const journalLines = groups.get(date) ?? [];
    const payload = {
      Date: date,
      Narration: `${JOURNAL_NARRATION_PREFIX}${formatDateDdMmYyyy(date)}`,
      Status: status,
      LineAmountTypes: 'Inclusive',
      JournalLines: journalLines.map(buildJournalLine),
    };
    // #region agent log
    debugLog(
      'xeroService.ts:pushManualJournals',
      'xero payload journal',
      {
        date,
        lineCount: journalLines.length,
        lineAmountTypes: payload.LineAmountTypes,
        sumLineAmount: journalLines.reduce((s, l) => s + l.netAmount, 0),
        taxTypes: journalLines.map((l) => ({
          acct: l.accountCode,
          tax: l.taxType ?? '(none)',
          amt: l.netAmount,
        })),
      },
      'GST'
    );
    // #endregion
    return payload;
  });

  const manualJournalIds: string[] = [];
  const errors: Array<{ date: string; message: string }> = [];

  for (let i = 0; i < manualJournals.length; i += MANUAL_JOURNAL_CHUNK) {
    const chunk = manualJournals.slice(i, i + MANUAL_JOURNAL_CHUNK);
    try {
      const data = await xeroPost<{
        ManualJournals?: Array<{ ManualJournalID?: string }>;
      }>(sessionId, '/api.xro/2.0/ManualJournals', { ManualJournals: chunk });

      for (const mj of data.ManualJournals ?? []) {
        if (mj.ManualJournalID) manualJournalIds.push(mj.ManualJournalID);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const parsed = parseXeroManualJournalErrors(err.response.data);
        const dates = chunk.map((c) => c.Date).join(', ');
        const fallback =
          'Xero rejected the journal. Check account codes, tax types, and tracking in Account_Mappings.';
        const message = parsed.length > 0 ? parsed.join('; ') : fallback;
        errors.push({ date: dates, message });
        if (err.response.status === 400) {
          const details =
            parsed.length > 0 ? parsed : [fallback];
          throw new XeroServiceError(
            'VALIDATION_ERROR',
            `Xero rejected manual journal(s) for ${dates}.`,
            undefined,
            details
          );
        }
      }
      throw mapXeroError(err);
    }
  }

  return {
    created: manualJournalIds.length,
    manualJournalIds,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function getAccounts(sessionId: string): Promise<XeroAccount[]> {
  const xero = await ensureValidToken(sessionId);

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
        }) => ({
          Code: a.Code,
          Name: a.Name,
          Type: a.Type,
          TaxType: a.TaxType || '',
          SystemAccount: a.SystemAccount || undefined,
        })
      );
  } catch (err) {
    throw mapXeroError(err);
  }
}

export async function getTaxRates(sessionId: string): Promise<XeroTaxRateOption[]> {
  try {
    const data = await xeroGet<{
      TaxRates?: Array<{
        TaxType: string;
        Name: string;
        TaxComponents?: Array<{ Rate?: number }>;
      }>;
    }>(sessionId, '/api.xro/2.0/TaxRates');
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
  sessionId: string
): Promise<XeroTrackingCategoryOption[]> {
  try {
    const data = await xeroGet<{
      TrackingCategories?: Array<{
        Name: string;
        Options?: Array<{ Name: string; Status?: string }>;
      }>;
    }>(sessionId, '/api.xro/2.0/TrackingCategories');
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

export async function getMappingOptions(
  sessionId: string
): Promise<XeroMappingOptions> {
  const [accounts, taxRates, trackingCategories] = await Promise.all([
    getAccounts(sessionId),
    getTaxRates(sessionId),
    getTrackingCategories(sessionId),
  ]);

  const accountOptions: XeroAccountOption[] = accounts.map((a) => ({
    Code: a.Code,
    Name: a.Name,
    Type: a.Type,
    SystemAccount: a.SystemAccount,
    displayLabel: `${a.Code} — ${a.Name}`,
  }));

  return { accounts: accountOptions, taxRates, trackingCategories };
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
