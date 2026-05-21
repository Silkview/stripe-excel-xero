import { useState } from 'react';
import type { XeroMappingOptions } from '@stripesync/shared';
import { apiGet } from '../utils/api';
import { friendlyError } from '../utils/errorMessages';
import { applyAccountMappingsDropdowns } from '../utils/accountMappingsExcel';
import { setupWorkbookSheets } from '../utils/officeHelpers';

interface SetupWorkbookProps {
  xeroConnected: boolean;
}

export default function SetupWorkbook({ xeroConnected }: SetupWorkbookProps) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);

  const applyDropdowns = async (): Promise<boolean> => {
    const res = await apiGet<XeroMappingOptions>('/api/xero/mapping-options');
    if (!res.success || !res.data) {
      setStatusMessage(friendlyError(res, 'Failed to load Xero mapping options.'));
      setStatusError(true);
      return false;
    }
    await applyAccountMappingsDropdowns(res.data);
    return true;
  };

  const handleSetup = async () => {
    setLoading(true);
    setStatusMessage(null);
    setStatusError(false);

    try {
      const result = await setupWorkbookSheets();

      const parts: string[] = [];
      if (result.created.length > 0) {
        parts.push(
          `Created ${result.created.length} sheet${result.created.length === 1 ? '' : 's'}: ${result.created.join(', ')}`
        );
      }
      if (result.skipped.length > 0) {
        parts.push(
          `Skipped ${result.skipped.length} existing: ${result.skipped.join(', ')}`
        );
      }
      if (result.created.length === 0 && result.skipped.length === 0) {
        parts.push('No sheets were created.');
      }

      if (
        xeroConnected &&
        (result.created.includes('Account_Mappings') ||
          result.skipped.includes('Account_Mappings'))
      ) {
        try {
          const ok = await applyDropdowns();
          if (ok) {
            parts.push('Xero dropdowns applied to Account_Mappings.');
          }
        } catch (err) {
          parts.push(
            err instanceof Error
              ? err.message
              : 'Could not apply Xero dropdowns.'
          );
          setStatusError(true);
        }
      } else if (
        result.created.includes('Account_Mappings') ||
        result.skipped.includes('Account_Mappings')
      ) {
        parts.push('Connect Xero to apply mapping dropdowns.');
      }

      setStatusMessage(parts.join('. '));
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to set up workbook sheets.'
      );
      setStatusError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshDropdowns = async () => {
    if (!xeroConnected) {
      setStatusMessage('Connect Xero first to refresh mapping dropdowns.');
      setStatusError(true);
      return;
    }

    setRefreshing(true);
    setStatusMessage(null);
    setStatusError(false);

    try {
      const ok = await applyDropdowns();
      if (ok) {
        setStatusMessage('Xero mapping dropdowns updated on Account_Mappings.');
      }
    } catch (err) {
      setStatusMessage(
        err instanceof Error
          ? err.message
          : 'Failed to refresh mapping dropdowns.'
      );
      setStatusError(true);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="mb-4 pb-3 border-b border-gray-200">
      <h2 className="text-sm font-semibold text-gray-800 mb-2">Workbook</h2>
      <button
        type="button"
        onClick={handleSetup}
        disabled={loading || refreshing}
        className="w-full py-2 bg-gray-700 text-white text-sm font-medium rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Setting up…' : 'Set up workbook sheets'}
      </button>
      <button
        type="button"
        onClick={handleRefreshDropdowns}
        disabled={loading || refreshing || !xeroConnected}
        className="w-full py-2 mt-2 bg-gray-500 text-white text-sm font-medium rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {refreshing ? 'Refreshing…' : 'Refresh Xero mapping dropdowns'}
      </button>
      <p className="text-xs text-gray-500 mt-1.5">
        Creates Stripe and Xero tabs with headers. Account_Mappings includes 6
        5 stripe object rows and Xero dropdowns when connected.
      </p>
      {!xeroConnected && (
        <p className="text-xs text-amber-700 mt-1">
          Connect Xero to populate mapping dropdowns.
        </p>
      )}
      {statusMessage && (
        <p
          className={`mt-2 text-xs ${statusError ? 'text-red-600' : 'text-gray-600'}`}
          role="status"
        >
          {statusMessage}
        </p>
      )}
    </section>
  );
}
