import { useState, useCallback, useEffect, useRef } from 'react';
import { apiGet, apiPatch, apiPost } from '../utils/api';
import { setWorkspaceId } from '../utils/session';
import type { PlanCode } from '@stripesync/shared';

export type OnboardingState = {
  needsAccountSetup: boolean;
  needsConnectionSetup: boolean;
  needsOnboarding: boolean;
  needsSetup: boolean;
  needsWebProvision: boolean;
  provisioning: boolean;
  planCode: PlanCode | null;
  workspaceId: string | null;
  hasXero: boolean;
  hasStripe: boolean;
  limits: {
    maxStripeConnections: number;
    maxWorkspaces: number;
  } | null;
  accountStripeCount: number;
  loading: boolean;
  error: string | null;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  finish: () => Promise<boolean>;
};

export function useOnboarding(enabled: boolean): OnboardingState {
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoProvisionTried = useRef(false);
  const [status, setStatus] = useState({
    needsAccountSetup: false,
    needsConnectionSetup: false,
    needsOnboarding: false,
    planCode: null as PlanCode | null,
    workspaceId: null as string | null,
    hasXero: false,
    hasStripe: false,
    limits: null as OnboardingState['limits'],
    accountStripeCount: 0,
  });

  const loadStatus = useCallback(async (tryAutoProvision: boolean) => {
    const res = await apiGet<{
      needsAccountSetup: boolean;
      needsConnectionSetup: boolean;
      needsOnboarding: boolean;
      planCode: PlanCode;
      workspaceId: string | null;
      hasXero: boolean;
      hasStripe: boolean;
      limits: {
        maxStripeConnections: number;
        maxWorkspaces: number;
      } | null;
    }>('/api/onboarding/status');

    if (!res.success || !res.data) {
      setError(res.error?.message ?? 'Could not load setup status.');
      return;
    }

    let d = res.data;
    let provisionError: string | null = null;

    if (tryAutoProvision && d.needsAccountSetup && !autoProvisionTried.current) {
      autoProvisionTried.current = true;
      setProvisioning(true);
      const completeRes = await apiPost<{
        accountId: string;
        workspaceId: string;
      }>('/api/onboarding/complete', {});

      setProvisioning(false);

      if (completeRes.success && completeRes.data) {
        setWorkspaceId(completeRes.data.workspaceId);
        setError(null);
        const retry = await apiGet<typeof d>('/api/onboarding/status');
        if (retry.success && retry.data) {
          d = retry.data;
        }
      } else {
        provisionError =
          completeRes.error?.message ?? 'Could not create your account.';
        setError(provisionError);
      }
    }

    setStatus({
      needsAccountSetup: d.needsAccountSetup,
      needsConnectionSetup: d.needsConnectionSetup,
      needsOnboarding: d.needsOnboarding,
      planCode: d.planCode,
      workspaceId: d.workspaceId,
      hasXero: d.hasXero,
      hasStripe: d.hasStripe,
      limits: d.limits
        ? {
            maxStripeConnections: d.limits.maxStripeConnections,
            maxWorkspaces: d.limits.maxWorkspaces,
          }
        : null,
      accountStripeCount: 0,
    });

    if (d.workspaceId) {
      setWorkspaceId(d.workspaceId);
      const stripeRes = await apiGet<{ accountStripeCount: number }>(
        '/api/stripe/connections'
      );
      if (stripeRes.success && stripeRes.data) {
        setStatus((s) => ({
          ...s,
          accountStripeCount: stripeRes.data!.accountStripeCount ?? 0,
        }));
      }
    }

    return provisionError;
  }, []);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled) return;
      if (!options?.silent) {
        setLoading(true);
        setError(null);
      }
      try {
        await loadStatus(!options?.silent);
      } catch (err) {
        if (!options?.silent) {
          setError(err instanceof Error ? err.message : 'Setup failed.');
        }
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [enabled, loadStatus]
  );

  useEffect(() => {
    autoProvisionTried.current = false;
    void refresh();
  }, [refresh]);

  const finish = useCallback(async () => {
    const res = await apiPatch<{ completed: boolean }>(
      '/api/onboarding/finish',
      {}
    );
    if (!res.success) {
      setError(res.error?.message ?? 'Could not finish setup.');
      return false;
    }
    await refresh();
    return true;
  }, [refresh]);

  const needsSetup = status.needsConnectionSetup;
  const needsWebProvision =
    status.needsAccountSetup && !!error && !provisioning;

  return {
    needsAccountSetup: status.needsAccountSetup,
    needsConnectionSetup: status.needsConnectionSetup,
    needsOnboarding: status.needsOnboarding,
    needsSetup,
    needsWebProvision,
    provisioning,
    planCode: status.planCode,
    workspaceId: status.workspaceId,
    hasXero: status.hasXero,
    hasStripe: status.hasStripe,
    limits: status.limits,
    accountStripeCount: status.accountStripeCount,
    loading,
    error,
    refresh,
    finish,
  };
}
