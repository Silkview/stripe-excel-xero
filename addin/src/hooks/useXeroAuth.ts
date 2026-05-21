import { useState, useCallback, useEffect } from 'react';
import type { XeroConnectionStatus } from '@stripesync/shared';
import { apiGet } from '../utils/api';
import { openAuthFlow } from '../utils/dialogAuth';
import { friendlyError } from '../utils/errorMessages';
import { getClientSessionId, setClientSessionId } from '../utils/session';

async function ensureClientSession(): Promise<void> {
  if (getClientSessionId()) return;
  const res = await apiGet<{ sessionId: string }>('/auth/session');
  if (res.success && res.data?.sessionId) {
    setClientSessionId(res.data.sessionId);
  }
}

export function useXeroAuth() {
  const [status, setStatus] = useState<XeroConnectionStatus>({
    connected: false,
  });
  const [loading, setLoading] = useState(false);
  const [waitingForBrowser, setWaitingForBrowser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      await ensureClientSession();
      const res = await apiGet<XeroConnectionStatus>('/api/xero/connections');
      if (res.success && res.data) {
        setStatus(res.data);
      }
    } catch {
      // ignore on initial load
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWaitingForBrowser(false);
    try {
      await ensureClientSession();
      const connectRes = await apiGet<{ url: string; sessionId: string }>(
        '/auth/xero/connect'
      );
      if (!connectRes.success || !connectRes.data?.url) {
        setError(friendlyError(connectRes));
        return;
      }
      if (connectRes.data.sessionId) {
        setClientSessionId(connectRes.data.sessionId);
      }
      setLoading(false);
      setWaitingForBrowser(true);
      await openAuthFlow(connectRes.data.url, async () => {
        const res = await apiGet<XeroConnectionStatus>('/api/xero/connections');
        return !!(res.success && res.data?.connected);
      });
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect Xero.'
      );
    } finally {
      setLoading(false);
      setWaitingForBrowser(false);
    }
  }, [refresh]);

  return { status, loading, waitingForBrowser, error, connect, refresh, setError };
}
