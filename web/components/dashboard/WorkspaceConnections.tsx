'use client';

import Link from 'next/link';
import ConnectStripeButton from '@/components/brand/ConnectStripeButton';
import ConnectXeroButton from '@/components/brand/ConnectXeroButton';
import StripeMark from '@/components/brand/StripeMark';
import XeroDisconnectButton from '@/components/brand/XeroDisconnectButton';
import XeroMark from '@/components/brand/XeroMark';
import type { WorkspaceSummary } from '@/lib/dashboard/types';

export default function WorkspaceConnections({
  workspace,
  maxStripePerWorkspace,
  xeroFeaturesEnabled = true,
  connecting,
  onConnectXero,
  onConnectStripe,
  onDisconnectXero,
  onDisconnectStripe,
  onRenameStripe,
}: {
  workspace: WorkspaceSummary;
  maxStripePerWorkspace: number;
  xeroFeaturesEnabled?: boolean;
  connecting: 'xero' | 'stripe' | null;
  onConnectXero: () => void;
  onConnectStripe: () => void;
  onDisconnectXero: () => void;
  onDisconnectStripe: (connectionId: string, label: string) => void;
  onRenameStripe: (connectionId: string, currentName: string) => void;
}) {
  const xeroStatus = workspace.xero?.status;
  const xeroConnected = workspace.xero?.connected ?? false;
  const xeroReconnect = xeroStatus === 'reconnect_required';
  const stripeConnections = workspace.stripe.filter((s) => s.stripe_account_id);
  const stripeConnected = stripeConnections.length > 0;
  const canAddStripe = stripeConnections.length < maxStripePerWorkspace;
  const connectDisabled = connecting !== null;
  const xeroLoading = connecting === 'xero';
  const stripeLoading = connecting === 'stripe';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="overflow-hidden rounded border border-border">
        {!xeroFeaturesEnabled ? (
          <div className="flex flex-col gap-2 bg-bg px-3 py-3">
            <div className="flex items-center gap-2">
              <XeroMark size={26} />
              <span className="text-[12.5px] font-semibold text-ink">Xero</span>
            </div>
            <p className="text-[11.5px] leading-snug text-text-2">
              Connect Xero, refresh mappings, and push to your ledger on Pro or
              Firm.
            </p>
            <Link
              href="/dashboard/billing"
              className="text-[11.5px] font-medium text-accent hover:underline"
            >
              Upgrade to Pro or Firm →
            </Link>
          </div>
        ) : xeroConnected && workspace.xero?.tenant_name && !xeroReconnect ? (
          <div className="flex items-center gap-2 bg-xero-light px-3 py-2">
            <div className="h-[26px] w-[26px] shrink-0">
              <XeroMark size={26} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold text-ink">
                {workspace.xero.tenant_name}
              </div>
              <div className="text-[11px] text-text-2">
                {workspace.xero.stale_refresh
                  ? 'Inactive — use soon or reconnect'
                  : 'Connected'}
              </div>
            </div>
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-success"
              title="Connected"
            />
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={onConnectXero}
                disabled={connectDisabled}
                className="shrink-0 rounded-[5px] border border-xero/30 bg-white px-2 py-0.5 text-[11px] font-medium text-xero-text hover:bg-xero-light disabled:opacity-50"
              >
                {xeroLoading ? 'Connecting…' : 'Reconnect'}
              </button>
              <XeroDisconnectButton
                compact
                onClick={onDisconnectXero}
                disabled={connectDisabled}
              />
            </div>
          </div>
        ) : xeroReconnect ? (
          <div className="flex flex-col gap-2 p-3">
            <p className="text-[12.5px] leading-snug text-text-2">
              Xero needs reconnect for this workspace.
            </p>
            <ConnectXeroButton
              onClick={onConnectXero}
              disabled={connectDisabled}
              loading={xeroLoading}
            />
          </div>
        ) : xeroLoading ? (
          <div className="p-3 text-[12.5px] text-text-2">
            Finish Xero sign-in in your browser…
          </div>
        ) : (
          <ConnectXeroButton
            onClick={onConnectXero}
            disabled={connectDisabled}
            loading={xeroLoading}
          />
        )}
      </div>

      <div className="overflow-hidden rounded border border-border">
        {stripeConnected ? (
          <>
            <div className="flex items-center gap-2 bg-stripe-light px-3 py-2">
              <StripeMark size={26} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-ink">Stripe</div>
                <div className="text-[11px] text-text-2">
                  {stripeConnections.length} account
                  {stripeConnections.length === 1 ? '' : 's'} connected
                </div>
              </div>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
            </div>
            <div className="border-t border-border bg-white px-3 py-2">
              <div className="mb-1.5 flex flex-col gap-1">
                {stripeConnections.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-[7px] border border-border bg-bg px-2 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11.5px] font-medium text-ink">
                        {s.display_name ?? s.stripe_account_id}
                      </div>
                      <div className="truncate font-mono text-[10.5px] text-text-3">
                        {s.stripe_account_id}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onRenameStripe(
                            s.id,
                            s.display_name ?? s.stripe_account_id
                          )
                        }
                        className="text-[10.5px] font-medium text-accent hover:underline"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onDisconnectStripe(
                            s.id,
                            s.display_name ?? s.stripe_account_id
                          )
                        }
                        className="text-[10.5px] font-medium text-red hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {canAddStripe && (
                <button
                  type="button"
                  onClick={onConnectStripe}
                  disabled={connectDisabled}
                  className="flex w-full items-center justify-center gap-1 rounded-[7px] border border-dashed border-border bg-transparent py-1.5 text-[11.5px] text-text-3 hover:border-stripe hover:bg-stripe-light hover:text-stripe disabled:opacity-50"
                >
                  + Add another account
                </button>
              )}
            </div>
          </>
        ) : stripeLoading ? (
          <div className="p-3 text-[12.5px] text-text-2">
            Finish Stripe sign-in in your browser…
          </div>
        ) : (
          <ConnectStripeButton
            onClick={onConnectStripe}
            disabled={connectDisabled}
            loading={stripeLoading}
          />
        )}
      </div>
    </div>
  );
}
