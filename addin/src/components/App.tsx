import { useState } from 'react';
import ConnectionPills from './ConnectionPills';
import Header from './ui/Header';
import StepTabs, { type StepTabId } from './ui/StepTabs';
import StripePanel from './StripePanel';
import BuildPanel from './BuildPanel';
import PushPanel from './PushPanel';
import SetupPanel from './SetupPanel';
import Button from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { useStripeAuth } from '../hooks/useStripeAuth';
import { useXeroAuth } from '../hooks/useXeroAuth';
import { useDefaultCurrency } from '../hooks/useDefaultCurrency';

export default function App() {
  const auth = useAuth();
  const workspace = useWorkspace(auth.signedIn);
  const apiReady = auth.signedIn && workspace.ready;
  const stripeAuth = useStripeAuth(apiReady);
  const xeroAuth = useXeroAuth(apiReady);
  const { currency, ready: currencyReady } = useDefaultCurrency(xeroAuth.status);
  const [activeTab, setActiveTab] = useState<StepTabId>('pull');
  const [showSetup, setShowSetup] = useState(false);
  const [tabBeforeSetup, setTabBeforeSetup] = useState<StepTabId>('pull');
  const [done, setDone] = useState<Partial<Record<StepTabId, boolean>>>({});

  const openSetup = () => {
    setTabBeforeSetup(activeTab);
    setShowSetup(true);
  };

  const closeSetup = () => {
    setShowSetup(false);
    setActiveTab(tabBeforeSetup);
  };

  if (!auth.signedIn) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans text-text p-4">
        <Header onOpenSetup={() => {}} />
        <p className="text-sm text-text-2 mb-3">
          Sign in to sync Stripe and Xero data in this workbook.
        </p>
        <Button variant="primary" onClick={auth.signIn} disabled={auth.loading}>
          {auth.loading ? 'Signing in…' : 'Sign in'}
        </Button>
        {auth.error && (
          <p className="text-xs text-warn-text mt-2">{auth.error}</p>
        )}
      </div>
    );
  }

  if (!workspace.ready) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans text-text p-4">
        <Header onOpenSetup={() => {}} />
        <p className="text-sm text-text-2">
          {workspace.loading ? 'Loading workspace…' : workspace.error ?? 'No workspace available.'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans text-text">
      <Header onOpenSetup={openSetup} />

      {workspace.workspaces.length > 1 && (
        <div className="px-3 py-1.5 border-b border-border bg-surface">
          <label className="text-[10px] font-semibold text-text-2 uppercase">
            Workspace
          </label>
          <select
            value={workspace.workspaceId ?? ''}
            onChange={(e) => workspace.selectWorkspace(e.target.value)}
            className="w-full mt-0.5 text-xs border border-border rounded-sm px-2 py-1 bg-bg"
          >
            {workspace.workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <ConnectionPills
        stripe={stripeAuth.status}
        xero={xeroAuth.status}
        stripeLoading={stripeAuth.loading}
        xeroLoading={xeroAuth.loading}
        stripeWaiting={stripeAuth.waitingForBrowser}
        xeroWaiting={xeroAuth.waitingForBrowser}
        onConnectStripe={stripeAuth.connect}
        onConnectXero={xeroAuth.connect}
        dimmed={showSetup}
        defaultCurrency={currencyReady ? currency : undefined}
      />

      {(stripeAuth.error || xeroAuth.error) && !showSetup && (
        <div className="mx-3 mt-2 text-xs text-warn-text bg-warn-bg px-2.5 py-2 rounded-sm border border-[#f5c9a8]">
          {stripeAuth.error || xeroAuth.error}
        </div>
      )}

      {showSetup ? (
        <SetupPanel
          xeroConnected={xeroAuth.status.connected}
          baseCurrency={currency}
          onBack={closeSetup}
        />
      ) : (
        <>
          <StepTabs
            active={activeTab}
            onChange={setActiveTab}
            done={done}
          />

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'pull' && (
              <StripePanel
                stripeConnected={stripeAuth.status.connected}
                currencyReady={currencyReady}
                defaultCurrency={currency}
                onPulled={() => setDone((d) => ({ ...d, pull: true }))}
              />
            )}
            {activeTab === 'build' && (
              <BuildPanel
                currencyReady={currencyReady}
                defaultCurrency={currency}
                onBuilt={() => setDone((d) => ({ ...d, build: true }))}
              />
            )}
            {activeTab === 'push' && (
              <PushPanel
                xeroConnected={xeroAuth.status.connected}
                currencyReady={currencyReady}
                defaultCurrency={currency}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
