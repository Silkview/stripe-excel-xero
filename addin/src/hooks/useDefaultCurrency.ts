import type { XeroConnectionStatus } from '@stripesync/shared';

/** Derive org default currency from Xero connection status (single source: parent `useXeroAuth`). */
export function useDefaultCurrency(status: XeroConnectionStatus) {
  const currency = status.baseCurrency;
  const ready = status.connected && !!currency;

  return { currency, ready };
}
