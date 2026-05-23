import { useState, useCallback, useEffect } from 'react';
import type { StripeConnectionStatus } from '@stripesync/shared';
import { apiGet } from '../utils/api';
import { openAuthFlow } from '../utils/dialogAuth';
import { friendlyError } from '../utils/errorMessages';
import {
  getStripeAccountId,
  setStripeAccountId,
  clearStripeAccountId,
} from '../utils/session';

export function useStripeAuth(enabled: boolean, workspaceId?: string | null) {
  const [status, setStatus] = useState<StripeConnectionStatus>({
    connected: false,
  });
  const [workspaceStripeCount, setWorkspaceStripeCount] = useState(0);
  const [maxStripePerWorkspace, setMaxStripePerWorkspace] = useState(1);
  const [selectedStripeAccountId, setSelectedStripeAccountIdState] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [waitingForBrowser, setWaitingForBrowser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSelectedAccount = useCallback((data: StripeConnectionStatus) => {
    const list = data.connections ?? [];
    const current = getStripeAccountId();
    const valid = list.some((c) => c.stripeAccountId === current);
    if (valid && current) {
      setSelectedStripeAccountIdState(current);
      return;
    }
    const next =
      data.defaultStripeAccountId ??
      list.find((c) => c.isDefault)?.stripeAccountId ??
      list[0]?.stripeAccountId;
    if (next) {
      setStripeAccountId(next);
      setSelectedStripeAccountIdState(next);
    } else {
      clearStripeAccountId();
      setSelectedStripeAccountIdState(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await apiGet<StripeConnectionStatus>('/api/stripe/status');
      if (res.success && res.data) {
        setStatus(res.data);
        syncSelectedAccount(res.data);
      }
      const listRes = await apiGet<{
        workspaceStripeCount: number;
        limits: {
          maxStripeConnectionsPerWorkspace: number;
        } | null;
      }>('/api/stripe/connections');
      if (listRes.success && listRes.data) {
        setWorkspaceStripeCount(listRes.data.workspaceStripeCount ?? 0);
        setMaxStripePerWorkspace(
          listRes.data.limits?.maxStripeConnectionsPerWorkspace ?? 1
        );
      }
    } catch {
      // ignore on initial load
    }
  }, [enabled, syncSelectedAccount]);

  useEffect(() => {
    refresh();
  }, [refresh, workspaceId]);

  const selectStripeAccount = useCallback((stripeAccountId: string) => {
    setStripeAccountId(stripeAccountId);
    setSelectedStripeAccountIdState(stripeAccountId);
  }, []);

  const connect = useCallback(
    async (flow: 'register' | 'login' = 'login') => {
      setLoading(true);
      setError(null);
      setWaitingForBrowser(false);
      try {
        const connectRes = await apiGet<{
          url: string;
          redirectUri?: string;
          flow?: string;
        }>(`/api/stripe/connect?flow=${flow}`);
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
          return !!(res.success && res.data?.connected);
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
    },
    [refresh]
  );

  const canAddAnother =
    workspaceStripeCount < maxStripePerWorkspace;

  return {
    status,
    selectedStripeAccountId,
    selectStripeAccount,
    canAddAnother,
    workspaceStripeCount,
    maxStripePerWorkspace,
    loading,
    waitingForBrowser,
    error,
    connect,
    refresh,
    setError,
  };
}
