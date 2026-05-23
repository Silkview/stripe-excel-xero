import { useState, useCallback } from 'react';
import type { XeroMappingOptions } from '@stripesync/shared';
import { apiGet } from '../utils/api';
import { friendlyError } from '../utils/errorMessages';
import { applyAccountMappingsDropdowns } from '../utils/accountMappingsExcel';
import { migrateAccountMappingsSheet } from '../utils/migrateAccountMappings';
import { setupWorkbookSheets } from '../utils/officeHelpers';
import { getWorkspaceId } from '../utils/session';

interface UseSetupActionsOptions {
  xeroConnected: boolean;
  workspaceName?: string;
  baseCurrency?: string;
}

export function useSetupActions({
  xeroConnected,
  workspaceName,
  baseCurrency,
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
    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'useSetupActions.ts:applyDropdowns:before',message:'mapping-options request',data:{sessionWorkspaceId:getWorkspaceId(),workspaceName,xeroConnectedProp:xeroConnected},timestamp:Date.now(),hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    const res = await apiGet<XeroMappingOptions>('/api/xero/mapping-options');
    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'useSetupActions.ts:applyDropdowns:after',message:'mapping-options response',data:{success:res.success,errorCode:res.error?.code,errorMessage:res.error?.message?.slice(0,120)},timestamp:Date.now(),hypothesisId:'B,C,D'})}).catch(()=>{});
    // #endregion
    if (!res.success || !res.data) {
      const code = res.error?.code;
      if (code === 'XERO_AUTH_REQUIRED') {
        setStatusMessage(
          `This workspace's Xero connection needs reconnect. Select workspace "${workspaceName ?? 'current'}" and connect Xero for that workspace.`
        );
      } else {
        setStatusMessage(
          friendlyError(res, 'Failed to load Xero mapping options.')
        );
      }
      setStatusError(true);
      return false;
    }
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
        xeroConnected &&
        (result.created.includes('Account_Mappings') ||
          result.skipped.includes('Account_Mappings'))
      ) {
        const ok = await applyDropdowns();
        if (ok) parts.push('Xero dropdowns applied.');
      }
      setStatusMessage(parts.join(' · ') || 'Workbook ready.');
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to set up workbook.'
      );
      setStatusError(true);
    } finally {
      setLoading(false);
    }
  }, [xeroConnected, applyDropdowns]);

  const refreshXero = useCallback(async () => {
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
  }, [xeroConnected, applyDropdowns]);

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
