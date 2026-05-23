import Card from './ui/Card';
import Button from './ui/Button';
import Field from './ui/Field';
import ResultBar from './ui/ResultBar';
import InfoRow from './ui/InfoRow';
import { useSetupActions } from '../hooks/useSetupActions';

interface SetupPanelProps {
  xeroConnected: boolean;
  workspaceName?: string;
  tenantName?: string;
  baseCurrency?: string;
  onBack: () => void;
}

export default function SetupPanel({
  xeroConnected,
  workspaceName,
  tenantName,
  baseCurrency,
  onBack,
}: SetupPanelProps) {
  const {
    setupSheets,
    refreshXero,
    loading,
    refreshing,
    busy,
    statusMessage,
    statusError,
  } = useSetupActions({ xeroConnected, workspaceName, baseCurrency });

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-3.5 py-2 border-b border-border bg-surface flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-accent bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
        <span className="text-xs font-semibold text-ink">Advanced setup</span>
      </div>

      <div className="p-3.5 overflow-y-auto flex-1">
        {(workspaceName || tenantName) && (
          <Card title="Workspace" icon="🏢" iconClass="bg-bg text-ink-2">
            {workspaceName && (
              <InfoRow>
                Workspace: <strong>{workspaceName}</strong>
              </InfoRow>
            )}
            {tenantName && (
              <InfoRow>
                Xero org: <strong>{tenantName}</strong>
              </InfoRow>
            )}
            <InfoRow className="text-ink-3 border-0 bg-transparent px-0">
              Dropdowns use the Xero organisation connected to the selected
              workspace.
            </InfoRow>
          </Card>
        )}

        <Card title="Default currency" icon="💱" iconClass="bg-xero-light text-xero-dark mt-3">
          <Field label="Organisation currency">
            <input
              type="text"
              readOnly
              value={baseCurrency ?? ''}
              placeholder="Connect Xero to set currency"
              className="w-full border border-border rounded-lg px-2.5 py-2 text-sm bg-bg text-ink font-mono"
            />
          </Field>
          <InfoRow>
            Set automatically from your Xero organisation base currency. All Stripe
            pulls, builds, and Xero postings use this currency only.
          </InfoRow>
        </Card>

        <Card title="Workbook" icon="📋" iconClass="bg-bg text-ink-2 mt-3">
          <div className="flex flex-col gap-2">
            <Button variant="ghost" onClick={() => void setupSheets()} disabled={busy}>
              {loading ? 'Setting up…' : 'Set up workbook sheets'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => void refreshXero()}
              disabled={busy || !xeroConnected}
            >
              {refreshing ? 'Refreshing…' : 'Refresh Xero dropdowns'}
            </Button>
          </div>
          <InfoRow>
            Creates Stripe and Xero tabs with headers. Edit mappings on the{' '}
            <span className="font-mono">Account_Mappings</span> sheet tab.
          </InfoRow>
          {!xeroConnected && (
            <InfoRow variant="amber">Connect Xero to refresh mapping dropdowns.</InfoRow>
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
