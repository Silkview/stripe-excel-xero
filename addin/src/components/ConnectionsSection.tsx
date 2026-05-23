import type { StripeConnectionItem, StripeConnectionStatus, XeroConnectionStatus } from '@stripesync/shared';
import XeroMark from './icons/XeroMark';
import StripeMark from './icons/StripeMark';

function truncateId(id: string, len = 14): string {
  if (id.length <= len) return id;
  return `${id.slice(0, len)}…`;
}

interface ConnectionsSectionProps {
  stripe: StripeConnectionStatus;
  xero: XeroConnectionStatus;
  stripeLoading: boolean;
  xeroLoading: boolean;
  stripeWaiting?: boolean;
  xeroWaiting?: boolean;
  onConnectStripe: () => void;
  onConnectAnotherStripe?: () => void;
  canAddAnotherStripe?: boolean;
  onConnectXero: () => void;
  xeroNeedsReconnect?: boolean;
  defaultCurrency?: string;
  selectedAccountIds: Set<string>;
  onToggleAccount: (stripeAccountId: string) => void;
  onSelectAllAccounts: () => void;
  dimmed?: boolean;
}

export default function ConnectionsSection({
  stripe,
  xero,
  stripeLoading,
  xeroLoading,
  stripeWaiting = false,
  xeroWaiting = false,
  onConnectStripe,
  onConnectAnotherStripe,
  canAddAnotherStripe = false,
  onConnectXero,
  xeroNeedsReconnect = false,
  defaultCurrency,
  selectedAccountIds,
  onToggleAccount,
  onSelectAllAccounts,
  dimmed,
}: ConnectionsSectionProps) {
  const stripeConnections = stripe.connections ?? [];
  const stripeConnected = stripe.connected;
  const xeroConnected = xero.connected && !xeroNeedsReconnect;

  return (
    <div
      className={`bg-surface border-b border-border px-3.5 py-2.5 flex flex-col gap-1.5 transition-opacity ${dimmed ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {/* Xero */}
      <div className="border border-border rounded overflow-hidden">
        {xeroConnected && xero.tenantName ? (
          <div className="px-3 py-2 bg-xero-light flex items-center gap-2">
            <div className="w-[26px] h-[26px] shrink-0">
              <XeroMark size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-ink truncate">
                {xero.tenantName}
              </div>
              <div className="text-[11px] text-ink-2 flex items-center gap-1">
                Connected
                {defaultCurrency && (
                  <span className="bg-white border border-xero/30 rounded px-1 text-[10px] font-semibold text-xero font-mono">
                    {defaultCurrency}
                  </span>
                )}
              </div>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" title="Connected" />
            <button
              type="button"
              onClick={onConnectXero}
              disabled={xeroLoading || xeroWaiting}
              className="px-2 py-0.5 rounded-[5px] border border-xero/30 bg-white text-[11px] font-medium text-xero-dark cursor-pointer hover:bg-xero-light disabled:opacity-50 shrink-0"
            >
              Reconnect
            </button>
          </div>
        ) : xeroNeedsReconnect ? (
          <div className="p-3 flex flex-col gap-2">
            <p className="text-[12.5px] text-ink-2 leading-snug">
              Xero needs reconnect for this workspace.
            </p>
            <button
              type="button"
              onClick={onConnectXero}
              disabled={xeroLoading || xeroWaiting}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-xero border-none rounded text-[13px] font-semibold text-white cursor-pointer hover:bg-xero-dark disabled:opacity-50"
            >
              <XeroMark size={20} />
              {xeroWaiting ? 'Finish in browser…' : xeroLoading ? 'Connecting…' : 'Reconnect to Xero'}
            </button>
          </div>
        ) : xeroWaiting ? (
          <div className="p-3 text-[12.5px] text-ink-2">Finish Xero sign-in in your browser…</div>
        ) : (
          <button
            type="button"
            onClick={onConnectXero}
            disabled={xeroLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-xero border-none rounded text-[13px] font-semibold text-white cursor-pointer hover:bg-xero-dark disabled:opacity-50"
          >
            <XeroMark size={20} />
            {xeroLoading ? 'Connecting…' : 'Connect to Xero'}
          </button>
        )}
      </div>

      {/* Stripe */}
      <div className="border border-border rounded overflow-hidden">
        {stripeConnected && stripeConnections.length > 0 ? (
          <>
            <div className="px-3 py-2 bg-stripe-light flex items-center gap-2">
              <StripeMark size={26} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-ink">Stripe</div>
                <div className="text-[11px] text-ink-2">
                  {stripeConnections.length} account
                  {stripeConnections.length === 1 ? '' : 's'} connected
                </div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
            </div>
            <div className="px-3 py-2 bg-white border-t border-rule-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10.5px] font-medium text-ink-3">
                  Accounts for pull
                </span>
                {stripeConnections.length > 1 && (
                  <button
                    type="button"
                    onClick={onSelectAllAccounts}
                    className="text-[10.5px] font-medium text-accent bg-transparent border-none cursor-pointer p-0 hover:underline"
                  >
                    Select all
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1 mb-1.5">
                {stripeConnections.map((c) => (
                  <StripeAccountRow
                    key={c.id}
                    connection={c}
                    selected={selectedAccountIds.has(c.stripeAccountId)}
                    onToggle={() => onToggleAccount(c.stripeAccountId)}
                  />
                ))}
              </div>
              {canAddAnotherStripe && onConnectAnotherStripe && (
                <button
                  type="button"
                  onClick={onConnectAnotherStripe}
                  disabled={stripeLoading || stripeWaiting}
                  className="flex items-center justify-center gap-1 w-full py-1.5 border border-dashed border-border rounded-[7px] text-[11.5px] text-ink-3 bg-transparent cursor-pointer hover:border-stripe hover:text-stripe hover:bg-stripe-light disabled:opacity-50"
                >
                  + Add another account
                </button>
              )}
            </div>
          </>
        ) : stripeWaiting ? (
          <div className="p-3 text-[12.5px] text-ink-2">
            Finish Stripe sign-in in your browser…
          </div>
        ) : (
          <button
            type="button"
            onClick={onConnectStripe}
            disabled={stripeLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-stripe border-none rounded text-[13px] font-semibold text-white cursor-pointer hover:bg-stripe-hover disabled:opacity-50"
          >
            <StripeMark size={22} />
            {stripeLoading ? 'Connecting…' : 'Connect Stripe'}
          </button>
        )}
      </div>
    </div>
  );
}

function StripeAccountRow({
  connection,
  selected,
  onToggle,
}: {
  connection: StripeConnectionItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const label = connection.displayName ?? connection.stripeAccountId;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-2 px-2 py-1.5 border rounded-[7px] cursor-pointer transition-colors text-left ${
        selected
          ? 'border-stripe/40 bg-stripe-light'
          : 'border-border bg-bg hover:border-[#c5cbda] hover:bg-rule-2'
      }`}
    >
      <span
        className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
          selected ? 'bg-stripe border-stripe' : 'bg-white border-border'
        }`}
      >
        {selected && (
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" aria-hidden>
            <path
              d="M2 5l2 2 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[11.5px] font-medium text-ink truncate">{label}</span>
        <span className="block text-[10.5px] text-ink-3 font-mono truncate">
          {truncateId(connection.stripeAccountId, 20)}
        </span>
      </span>
    </button>
  );
}
