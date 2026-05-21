import type { ReactNode } from 'react';
import type { StripeConnectionStatus, XeroConnectionStatus } from '@stripesync/shared';
import StripeMark from './icons/StripeMark';
import XeroMark from './icons/XeroMark';

interface ConnectionPillsProps {
  stripe: StripeConnectionStatus;
  xero: XeroConnectionStatus;
  stripeLoading: boolean;
  xeroLoading: boolean;
  stripeWaiting?: boolean;
  xeroWaiting?: boolean;
  onConnectStripe: () => void;
  onConnectXero: () => void;
  dimmed?: boolean;
  defaultCurrency?: string;
}

function pillShellClass(connected: boolean): string {
  return connected
    ? 'bg-success-bg border-[#b8e6d0]'
    : 'bg-bg border-border';
}

function pillDotClass(connected: boolean): string {
  return connected ? 'bg-success' : 'bg-text-3';
}

function pillDetailClass(connected: boolean, waiting: boolean): string {
  if (waiting) return 'text-text-2';
  return connected ? 'text-success-text' : 'text-text-3';
}

interface ProviderPillProps {
  label: string;
  connectLabel: string;
  logo: ReactNode;
  connectButtonClass: string;
  connected: boolean;
  waiting: boolean;
  loading: boolean;
  detail: string;
  onConnect: () => void;
}

function ProviderPill({
  label,
  connectLabel,
  logo,
  connectButtonClass,
  connected,
  waiting,
  loading,
  detail,
  onConnect,
}: ProviderPillProps) {
  return (
    <div
      className={`w-full p-2 px-2.5 rounded-sm border flex items-center gap-2 min-w-0 cursor-default ${pillShellClass(connected)}`}
    >
      {connected && (
        <span
          className={`w-[7px] h-[7px] rounded-full shrink-0 ${pillDotClass(connected)}`}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-text-2">
          {label}
        </div>
        <div
          className={`text-[11px] font-medium truncate ${pillDetailClass(connected, waiting)}`}
        >
          {detail}
        </div>
      </div>
      {!connected && !waiting && (
        <button
          type="button"
          onClick={onConnect}
          disabled={loading}
          aria-label={`Connect to ${connectLabel}`}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[11px] font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${connectButtonClass}`}
        >
          {logo}
          <span>{loading ? '…' : 'Connect'}</span>
        </button>
      )}
      {connected && (
        <span className="text-success text-[10px] font-semibold shrink-0">✓</span>
      )}
    </div>
  );
}

export default function ConnectionPills({
  stripe,
  xero,
  stripeLoading,
  xeroLoading,
  stripeWaiting = false,
  xeroWaiting = false,
  onConnectStripe,
  onConnectXero,
  dimmed,
  defaultCurrency,
}: ConnectionPillsProps) {
  const stripeConnected = stripe.connected;
  const xeroConnected = xero.connected;

  const stripeDetail = stripeWaiting
    ? 'Finish sign-in in browser…'
    : stripeConnected && stripe.stripe_user_id
      ? stripe.stripe_user_id
      : 'Not connected';

  const xeroDetail = xeroWaiting
    ? 'Finish sign-in in browser…'
    : xeroConnected && xero.tenantName
      ? xero.tenantName
      : 'Not connected';

  const stripeLogo = <StripeMark size={14} />;
  const xeroLogo = <XeroMark size={14} />;

  return (
    <div
      className={`flex flex-col gap-2 p-2.5 px-3 bg-surface border-b border-border transition-opacity ${dimmed ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {defaultCurrency && (
        <div className="flex justify-end">
          <span
            className="text-[10px] font-bold uppercase tracking-wide text-xero-dark bg-xero-light border border-[#c5e8f5] px-2 py-1 rounded-sm"
            title="Organisation currency from Xero"
          >
            {defaultCurrency}
          </span>
        </div>
      )}
      <ProviderPill
        label="Stripe"
        connectLabel="Stripe"
        logo={stripeLogo}
        connectButtonClass="border-[#d4d6ff] bg-stripe-light text-stripe hover:bg-[#e0e3ff] hover:border-stripe"
        connected={stripeConnected}
        waiting={stripeWaiting}
        loading={stripeLoading}
        detail={stripeDetail}
        onConnect={onConnectStripe}
      />
      <ProviderPill
        label="Xero"
        connectLabel="Xero"
        logo={xeroLogo}
        connectButtonClass="border-[#b8e8f2] bg-xero-light text-xero-dark hover:bg-[#d0f0fa] hover:border-xero"
        connected={xeroConnected}
        waiting={xeroWaiting}
        loading={xeroLoading}
        detail={xeroDetail}
        onConnect={onConnectXero}
      />
    </div>
  );
}
