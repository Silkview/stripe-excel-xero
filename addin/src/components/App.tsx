import { useState } from 'react';
import ConnectionPills from './ConnectionPills';
import Header from './ui/Header';
import StepTabs, { type StepTabId } from './ui/StepTabs';
import StripePanel from './StripePanel';
import BuildPanel from './BuildPanel';
import PushPanel from './PushPanel';
import SetupPanel from './SetupPanel';
import { useStripeAuth } from '../hooks/useStripeAuth';
import { useXeroAuth } from '../hooks/useXeroAuth';
import { useDefaultCurrency } from '../hooks/useDefaultCurrency';

export default function App() {
  const stripeAuth = useStripeAuth();
  const xeroAuth = useXeroAuth();
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

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans text-text">
      <Header onOpenSetup={openSetup} />

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
