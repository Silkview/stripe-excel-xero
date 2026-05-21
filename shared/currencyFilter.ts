export function normalizeCurrencyCode(code: string): string {
  return code.trim().toUpperCase();
}

export function rowMatchesCurrency(
  rowCurrency: string,
  defaultCurrency: string
): boolean {
  return normalizeCurrencyCode(rowCurrency) === normalizeCurrencyCode(defaultCurrency);
}

export function filterRowsByCurrency<T extends { currency: string }>(
  rows: T[],
  defaultCurrency: string
): { rows: T[]; excludedByCurrency: number } {
  const target = normalizeCurrencyCode(defaultCurrency);
  const filtered = rows.filter(
    (r) => normalizeCurrencyCode(r.currency) === target
  );
  return {
    rows: filtered,
    excludedByCurrency: rows.length - filtered.length,
  };
}
