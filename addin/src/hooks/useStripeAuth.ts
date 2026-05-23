import { useState, useCallback, useEffect } from 'react';
import type { StripeConnectionStatus } from '@stripesync/shared';
import { apiGet } from '../utils/api';
import { openAuthFlow } from '../utils/dialogAuth';
import { friendlyError } from '../utils/errorMessages';

export function useStripeAuth(enabled: boolean) {
  const [status, setStatus] = useState<StripeConnectionStatus>({
    connected: false,
  });
  const [loading, setLoading] = useState(false);
  const [waitingForBrowser, setWaitingForBrowser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await apiGet<StripeConnectionStatus>('/api/stripe/status');
      if (res.success && res.data) {
        setStatus(res.data);
      }
    } catch {
      // ignore on initial load
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(async (flow: 'register' | 'login' = 'login') => {
    setLoading(true);
    setError(null);
    setWaitingForBrowser(false);
    try {
      const connectRes = await apiGet<{ url: string }>(
        `/api/stripe/connect?flow=${flow}`
      );
      if (!connectRes.success || !connectRes.data?.url) {
        const msg = friendlyError(connectRes);
        setError(
          connectRes.error?.code === 'CONFIG_ERROR'
            ? `${msg} Check dashboard Settings → Stripe Connect (platform) or contact your admin.`
            : msg
        );
        return;
      }
      setLoading(false);
      setWaitingForBrowser(true);
      await openAuthFlow(connectRes.data.url, async () => {
        const res = await apiGet<StripeConnectionStatus>('/api/stripe/status');
        if (res.success && res.data?.connected) return true;
        const list = await apiGet<{ accountStripeCount: number }>(
          '/api/stripe/connections'
        );
        return !!(list.success && (list.data?.accountStripeCount ?? 0) > 0);
      });
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect Stripe.'
      );
    } finally {
      setLoading(false);
      setWaitingForBrowser(false);
    }
  }, [refresh]);

  return {
    status,
    loading,
    waitingForBrowser,
    error,
    connect,
    refresh,
    setError,
  };
}
