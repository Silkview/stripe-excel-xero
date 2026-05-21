import ConnectionStatus from './ConnectionStatus';
import SetupWorkbook from './SetupWorkbook';
import StripePanel from './StripePanel';
import XeroPanel from './XeroPanel';
import { useStripeAuth } from '../hooks/useStripeAuth';
import { useXeroAuth } from '../hooks/useXeroAuth';

export default function App() {
  const stripeAuth = useStripeAuth();
  const xeroAuth = useXeroAuth();

  return (
    <div className="p-3 bg-white min-h-screen">
      <h1 className="text-base font-bold text-gray-900 mb-3">StripeSync</h1>

      <ConnectionStatus
        stripe={stripeAuth.status}
        xero={xeroAuth.status}
        stripeLoading={stripeAuth.loading}
        xeroLoading={xeroAuth.loading}
        stripeWaiting={stripeAuth.waitingForBrowser}
        xeroWaiting={xeroAuth.waitingForBrowser}
        onConnectStripe={stripeAuth.connect}
        onConnectXero={xeroAuth.connect}
      />

      {(stripeAuth.error || xeroAuth.error) && (
        <div className="mb-3 text-xs text-red-600 bg-red-50 p-2 rounded">
          {stripeAuth.error || xeroAuth.error}
        </div>
      )}

      <SetupWorkbook xeroConnected={xeroAuth.status.connected} />

      <StripePanel connected={stripeAuth.status.connected} />
      <XeroPanel xeroConnected={xeroAuth.status.connected} />
    </div>
  );
}
