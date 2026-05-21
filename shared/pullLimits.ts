export const MAX_STRIPE_PULL_DAYS = 90;
export const MAX_STRIPE_PULL_ROWS = 2000;

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

export function stripePullRowCountError(count: number): string | null {
  if (count > MAX_STRIPE_PULL_ROWS) {
    return `${count} rows returned; maximum is ${MAX_STRIPE_PULL_ROWS}. Narrow the date range and try again.`;
  }
  return null;
}
