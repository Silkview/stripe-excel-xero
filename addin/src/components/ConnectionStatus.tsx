import type { StripeConnectionStatus, XeroConnectionStatus } from '@stripesync/shared';

interface ConnectionStatusProps {
  stripe: StripeConnectionStatus;
  xero: XeroConnectionStatus;
  stripeLoading: boolean;
  xeroLoading: boolean;
  stripeWaiting?: boolean;
  xeroWaiting?: boolean;
  onConnectStripe: () => void;
  onConnectXero: () => void;
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
        connected ? 'bg-green-500' : 'bg-orange-400'
      }`}
    />
  );
}

export default function ConnectionStatus({
  stripe,
  xero,
  stripeLoading,
  xeroLoading,
  stripeWaiting = false,
  xeroWaiting = false,
  onConnectStripe,
  onConnectXero,
}: ConnectionStatusProps) {
  return (
    <div className="border-b border-gray-200 pb-3 mb-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <StatusDot connected={stripe.connected} />
          <span className="font-medium text-gray-700">Stripe</span>
          {stripe.connected && stripe.stripe_user_id ? (
            <p className="text-xs text-gray-500 truncate ml-3.5">
              Connected as {stripe.stripe_user_id}
            </p>
          ) : stripeWaiting ? (
            <p className="text-xs text-blue-600 ml-3.5">Finish sign-in in your browser…</p>
          ) : (
            <p className="text-xs text-gray-500 ml-3.5">Not connected</p>
          )}
        </div>
        {!stripe.connected && !stripeWaiting && (
          <button
            type="button"
            onClick={onConnectStripe}
            disabled={stripeLoading}
            className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 shrink-0"
          >
            {stripeLoading ? '…' : 'Connect Stripe'}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <StatusDot connected={xero.connected} />
          <span className="font-medium text-gray-700">Xero</span>
          {xero.connected && xero.tenantName ? (
            <p className="text-xs text-gray-500 truncate ml-3.5">
              Connected: {xero.tenantName}
            </p>
          ) : xeroWaiting ? (
            <p className="text-xs text-blue-600 ml-3.5">Finish sign-in in your browser…</p>
          ) : (
            <p className="text-xs text-gray-500 ml-3.5">Not connected</p>
          )}
        </div>
        {!xero.connected && !xeroWaiting && (
          <button
            type="button"
            onClick={onConnectXero}
            disabled={xeroLoading}
            className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 shrink-0"
          >
            {xeroLoading ? '…' : 'Connect Xero'}
          </button>
        )}
      </div>
    </div>
  );
}
