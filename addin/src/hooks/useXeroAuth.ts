import { useState, useCallback, useEffect } from 'react';
import type { XeroConnectionStatus } from '@stripesync/shared';
import { apiGet } from '../utils/api';
import { openAuthFlow } from '../utils/dialogAuth';
import { friendlyError } from '../utils/errorMessages';

export function useXeroAuth(enabled: boolean) {
  const [status, setStatus] = useState<XeroConnectionStatus>({
    connected: false,
  });
  const [loading, setLoading] = useState(false);
  const [waitingForBrowser, setWaitingForBrowser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await apiGet<XeroConnectionStatus>('/api/xero/connections');
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

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWaitingForBrowser(false);
    try {
      const connectRes = await apiGet<{ url: string }>('/auth/xero/connect');
      if (!connectRes.success || !connectRes.data?.url) {
        setError(friendlyError(connectRes));
        return;
      }
      setLoading(false);
      setWaitingForBrowser(true);
      await openAuthFlow(connectRes.data.url, async () => {
        const res = await apiGet<XeroConnectionStatus>('/api/xero/connections');
        return !!(res.success && res.data?.connected);
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Xero.');
    } finally {
      setLoading(false);
      setWaitingForBrowser(false);
    }
  }, [refresh]);

  return { status, loading, waitingForBrowser, error, connect, refresh, setError };
}
