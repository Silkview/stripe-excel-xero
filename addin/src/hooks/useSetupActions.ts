import { useState, useCallback } from 'react';
import type { XeroMappingOptions } from '@stripesync/shared';
import { apiGet } from '../utils/api';
import { friendlyError } from '../utils/errorMessages';
import { applyAccountMappingsDropdowns } from '../utils/accountMappingsExcel';
import { agentDebugLog } from '../utils/agentDebugLog';
import { migrateAccountMappingsSheet } from '../utils/migrateAccountMappings';
import { setupWorkbookSheets } from '../utils/officeHelpers';
interface UseSetupActionsOptions {
  xeroConnected: boolean;
  workspaceName?: string;
  baseCurrency?: string;
  xeroFeaturesEnabled?: boolean;
}

export function useSetupActions({
  xeroConnected,
  workspaceName,
  baseCurrency,
  xeroFeaturesEnabled = true,
}: UseSetupActionsOptions) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);

  const clearStatus = useCallback(() => {
    setStatusMessage(null);
    setStatusError(false);
  }, []);

  const applyDropdowns = useCallback(async (): Promise<boolean> => {
    await migrateAccountMappingsSheet();
    const res = await apiGet<XeroMappingOptions>('/api/xero/mapping-options');
    if (!res.success || !res.data) {
      const code = res.error?.code;
      if (code === 'XERO_AUTH_REQUIRED') {
        setStatusMessage(
          `This workspace's Xero connection needs reconnect. Select workspace "${workspaceName ?? 'current'}" and connect Xero for that workspace.`
        );
      } else if (code === 'XERO_UPGRADE_REQUIRED') {
        setStatusMessage(
          friendlyError(res, 'Upgrade to Pro or Firm to refresh Xero mappings.')
        );
      } else {
        setStatusMessage(
          friendlyError(res, 'Failed to load Xero mapping options.')
        );
      }
      setStatusError(true);
      return false;
    }
    // #region agent log
    agentDebugLog({
      location: 'useSetupActions.ts:applyDropdowns',
      message: 'loaded mapping options',
      data: {
        baseCurrency: baseCurrency ?? null,
        accountCount: res.data.accounts?.length ?? 0,
        taxRateCount: res.data.taxRates?.length ?? 0,
        trackingCategoryCount: res.data.trackingCategories?.length ?? 0,
      },
      hypothesisId: 'H1-H2',
      runId: 'post-fix-v2',
    });
    // #endregion
    await applyAccountMappingsDropdowns(res.data, baseCurrency);
    return true;
  }, [workspaceName, baseCurrency]);

  const setupSheets = useCallback(async () => {
    setLoading(true);
    setStatusMessage(null);
    setStatusError(false);
    try {
      const result = await setupWorkbookSheets();
      await migrateAccountMappingsSheet();
      const parts: string[] = [];
      if (result.created.length > 0) {
        parts.push(`Created: ${result.created.join(', ')}`);
      }
      if (result.skipped.length > 0) {
        parts.push(`Existing: ${result.skipped.join(', ')}`);
      }
      if (
        xeroFeaturesEnabled &&
        xeroConnected &&
        (result.created.includes('Account_Mappings') ||
          result.skipped.includes('Account_Mappings'))
      ) {
        const ok = await applyDropdowns();
        if (ok) parts.push('Xero dropdowns applied.');
      }
      setStatusMessage(parts.join(' · ') || 'Workbook ready.');
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',runId:'pre-fix',hypothesisId:'H1-H5',location:'useSetupActions.ts:setupSheets:catch',message:'setupSheets caught error',data:{message:err instanceof Error?err.message:String(err),stack:err instanceof Error?(err.stack??'').slice(0,800):null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to set up workbook.'
      );
      setStatusError(true);
    } finally {
      setLoading(false);
    }
  }, [xeroConnected, xeroFeaturesEnabled, applyDropdowns]);

  const refreshXero = useCallback(async () => {
    if (!xeroFeaturesEnabled) {
      setStatusMessage('Upgrade to Pro or Firm to refresh Xero mappings.');
      setStatusError(true);
      return;
    }
    if (!xeroConnected) {
      setStatusMessage('Connect Xero first.');
      setStatusError(true);
      return;
    }
    setRefreshing(true);
    setStatusMessage(null);
    setStatusError(false);
    try {
      const ok = await applyDropdowns();
      if (ok) {
        setStatusMessage('Mapping dropdowns refreshed on Account_Mappings sheet.');
      }
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to refresh dropdowns.'
      );
      setStatusError(true);
    } finally {
      setRefreshing(false);
    }
  }, [xeroConnected, xeroFeaturesEnabled, applyDropdowns]);

  return {
    setupSheets,
    refreshXero,
    applyDropdowns,
    loading,
    refreshing,
    busy: loading || refreshing,
    statusMessage,
    statusError,
    clearStatus,
  };
}
