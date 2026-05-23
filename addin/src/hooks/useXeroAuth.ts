import { useState, useCallback, useEffect } from 'react';
import type { XeroConnectionStatus } from '@stripesync/shared';
import { apiGet } from '../utils/api';
import { openAuthFlow } from '../utils/dialogAuth';
import { friendlyError } from '../utils/errorMessages';
import { getWorkspaceId } from '../utils/session';

export function useXeroAuth(enabled: boolean, workspaceId?: string | null) {
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
        // #region agent log
        fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'useXeroAuth.ts:refresh',message:'xero connections status',data:{sessionWorkspaceId:getWorkspaceId(),hookWorkspaceId:workspaceId??null,connected:res.data.connected,status:res.data.status,hasCurrency:!!res.data.baseCurrency,refreshErrorCode:res.data.refreshErrorCode??null},timestamp:Date.now(),hypothesisId:'A,E'})}).catch(()=>{});
        // #endregion
        setStatus(res.data);
        if (res.data.status === 'reconnect_required') {
          setError(
            'This workspace needs Xero reconnect. Use Connect Xero for this workspace.'
          );
        }
      }
    } catch {
      // ignore on initial load
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh, workspaceId]);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWaitingForBrowser(false);
    try {
      const connectRes = await apiGet<{ url: string }>('/api/xero/connect');
      if (!connectRes.success || !connectRes.data?.url) {
        setError(friendlyError(connectRes));
        return;
      }
      setLoading(false);
      setWaitingForBrowser(true);
      await openAuthFlow(connectRes.data.url, async () => {
        const res = await apiGet<XeroConnectionStatus>('/api/xero/connections');
        return !!(
          res.success &&
          res.data?.connected &&
          res.data.status !== 'reconnect_required'
        );
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Xero.');
    } finally {
      setLoading(false);
      setWaitingForBrowser(false);
    }
  }, [refresh]);

  const needsReconnect = status.status === 'reconnect_required';

  return {
    status,
    needsReconnect,
    loading,
    waitingForBrowser,
    error,
    connect,
    refresh,
    setError,
  };
}
