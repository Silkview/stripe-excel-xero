import { useState, useCallback, useEffect } from 'react';
import type { StripeConnectionStatus } from '@stripesync/shared';
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

export function useStripeAuth() {
  const [status, setStatus] = useState<StripeConnectionStatus>({
    connected: false,
  });
  const [loading, setLoading] = useState(false);
  const [waitingForBrowser, setWaitingForBrowser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      await ensureClientSession();
      const res = await apiGet<StripeConnectionStatus>('/auth/stripe/status');
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
        '/auth/stripe/connect'
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
        const res = await apiGet<StripeConnectionStatus>('/auth/stripe/status');
        return !!(res.success && res.data?.connected);
      });
      await refresh();
    } catch (err) {
      // #region agent log
      const ax = err as { code?: string; message?: string; isAxiosError?: boolean };
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'useStripeAuth.ts:connect',message:'connect catch',data:{code:ax?.code,message:ax?.message,isAxiosError:ax?.isAxiosError},timestamp:Date.now(),hypothesisId:'A,B,C'})}).catch(()=>{});
      // #endregion
      setError(
        err instanceof Error ? err.message : 'Failed to connect Stripe.'
      );
    } finally {
      setLoading(false);
      setWaitingForBrowser(false);
    }
  }, [refresh]);

  return { status, loading, waitingForBrowser, error, connect, refresh, setError };
}
