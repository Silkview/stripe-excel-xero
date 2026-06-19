import type { PlanCode } from './types';

export const MAX_STRIPE_PULL_DAYS = 90;
export const MAX_STRIPE_PULL_ROWS_FREE = 100;
export const MAX_STRIPE_PULL_ROWS_PAID = 2000;
/** @deprecated Use maxStripePullRows(planCode) */
export const MAX_STRIPE_PULL_ROWS = MAX_STRIPE_PULL_ROWS_PAID;

export function maxStripePullRows(
  planCode: PlanCode | null | undefined
): number {
  return planCode === 'free' ? MAX_STRIPE_PULL_ROWS_FREE : MAX_STRIPE_PULL_ROWS_PAID;
}

export const STRIPE_API_PAGE_SIZE = 100;
export const STRIPE_API_MAX_PAGES = 20;
export const STRIPE_API_PAGE_DELAY_MS = 1000;

export type StripeFetchLimits = {
  maxPages: number;
  maxItems: number;
  pageDelayMs: number;
};

export function stripeFetchLimitsForPlan(
  planCode: PlanCode | null | undefined
): StripeFetchLimits {
  const maxItems = maxStripePullRows(planCode);
  const maxPages = Math.min(
    STRIPE_API_MAX_PAGES,
    Math.max(1, Math.ceil(maxItems / STRIPE_API_PAGE_SIZE))
  );
  return { maxPages, maxItems, pageDelayMs: STRIPE_API_PAGE_DELAY_MS };
}

function parseYmd(dateStr: string): Date | null {
  const s = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Inclusive calendar-day span between from and to (YYYY-MM-DD). */
export function stripePullDaySpan(from: string, to: string): number | null {
  const fromDate = parseYmd(from);
  const toDate = parseYmd(to);
  if (!fromDate || !toDate) return null;
  if (toDate < fromDate) return null;
  const ms = toDate.getTime() - fromDate.getTime();
  return Math.floor(ms / 86400000) + 1;
}

export function isStripePullRangeValid(from: string, to: string): boolean {
  const span = stripePullDaySpan(from, to);
  return span != null && span <= MAX_STRIPE_PULL_DAYS;
}

export function stripePullRangeError(from: string, to: string): string | null {
  const span = stripePullDaySpan(from, to);
  if (span == null) {
    return 'Invalid date range. Use YYYY-MM-DD with from on or before to.';
  }
  if (span > MAX_STRIPE_PULL_DAYS) {
    return `Date range is ${span} days. Maximum allowed is ${MAX_STRIPE_PULL_DAYS} days.`;
  }
  return null;
}

export function stripePullRowCountError(
  count: number,
  maxRows: number = MAX_STRIPE_PULL_ROWS_PAID
): string | null {
  if (count > maxRows) {
    return `${count} rows returned; maximum is ${maxRows}. Narrow the date range and try again.`;
  }
  return null;
}
