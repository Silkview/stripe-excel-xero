import { useState } from 'react';
import type { XeroMappingOptions } from '@stripesync/shared';
import Card from './ui/Card';
import Button from './ui/Button';
import Field from './ui/Field';
import ResultBar from './ui/ResultBar';
import InfoRow from './ui/InfoRow';
import { apiGet } from '../utils/api';
import { friendlyError } from '../utils/errorMessages';
import { applyAccountMappingsDropdowns } from '../utils/accountMappingsExcel';
import { migrateAccountMappingsSheet } from '../utils/migrateAccountMappings';
import { setupWorkbookSheets } from '../utils/officeHelpers';

interface SetupPanelProps {
  xeroConnected: boolean;
  baseCurrency?: string;
  onBack: () => void;
}

export default function SetupPanel({
  xeroConnected,
  baseCurrency,
  onBack,
}: SetupPanelProps) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);

  const applyDropdowns = async (): Promise<boolean> => {
    await migrateAccountMappingsSheet();
    const res = await apiGet<XeroMappingOptions>('/api/xero/mapping-options');
    if (!res.success || !res.data) {
      setStatusMessage(friendlyError(res, 'Failed to load Xero mapping options.'));
      setStatusError(true);
      return false;
    }
    await applyAccountMappingsDropdowns(res.data, baseCurrency);
    return true;
  };

  const handleSetup = async () => {
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
  };

  const handleRefresh = async () => {
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
  };

  const busy = loading || refreshing;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-3 py-2 border-b border-border bg-surface flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-stripe bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
        <span className="text-xs font-semibold text-text">Setup</span>
      </div>

      <div className="p-3 overflow-y-auto flex-1">
        <Card title="Default currency" icon="💱" iconClass="bg-xero-light text-xero-dark">
          <Field label="Organisation currency">
            <input
              type="text"
              readOnly
              value={baseCurrency ?? ''}
              placeholder="Connect Xero to set currency"
              className="w-full border border-border rounded-sm px-2 py-1.5 text-sm bg-bg text-text font-mono"
            />
          </Field>
          <InfoRow className="mt-2">
            Set automatically from your Xero organisation base currency. All Stripe
            pulls, builds, and Xero postings use this currency only.
          </InfoRow>
        </Card>

        <Card title="Workbook" icon="📋" iconClass="bg-bg text-text-2 mt-3">
          <div className="flex flex-col gap-2">
            <Button variant="ghost" onClick={handleSetup} disabled={busy}>
              {loading ? 'Setting up…' : 'Set up workbook sheets'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleRefresh}
              disabled={busy || !xeroConnected}
            >
              {refreshing ? 'Refreshing…' : 'Refresh Xero dropdowns'}
            </Button>
          </div>
          <InfoRow className="mt-2">
            Creates Stripe and Xero tabs with headers. Edit mappings on the{' '}
            <span className="font-mono">Account_Mappings</span> sheet tab. Connect
            Xero to apply dropdowns there.
          </InfoRow>
          {!xeroConnected && (
            <InfoRow className="mt-2 text-warn">
              Connect Xero to refresh mapping dropdowns on the sheet.
            </InfoRow>
          )}
        </Card>

        {statusMessage && (
          <ResultBar variant={statusError ? 'warn' : 'success'}>
            {statusMessage}
          </ResultBar>
        )}
      </div>
    </div>
  );
}
