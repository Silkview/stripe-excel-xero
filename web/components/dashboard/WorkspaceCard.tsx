'use client';

import { useState } from 'react';
import type { WorkspaceSummary } from '@/lib/dashboard/types';
import { connectWorkspaceProvider, prepareOAuthPopup } from '@/lib/dashboard/oauth-connect';
import ConnRow from './ConnRow';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import RenameWorkspaceModal from './RenameWorkspaceModal';
import DeleteWorkspaceModal from './DeleteWorkspaceModal';
import NameStripeConnectionModal from './NameStripeConnectionModal';
import WorkspaceTeamFooter from './WorkspaceTeamFooter';
import { DashboardModal, useToast } from './dashboard-ui';

export default function WorkspaceCard({
  workspace,
  maxStripePerWorkspace = 1,
  onInvite,
  onConnectionsChanged,
}: {
  workspace: WorkspaceSummary;
  maxStripePerWorkspace?: number;
  onInvite: (workspaceId: string) => void;
  onConnectionsChanged?: () => void;
}) {
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [connecting, setConnecting] = useState<'xero' | 'stripe' | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nameStripe, setNameStripe] = useState<{
    connectionId: string;
    suggestedName: string;
  } | null>(null);
  const [renameStripe, setRenameStripe] = useState<{
    connectionId: string;
    currentName: string;
  } | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<
    | { provider: 'xero' }
    | { provider: 'stripe'; connectionId: string; label: string }
    | null
  >(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const created = new Date(workspace.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const xeroStatus = workspace.xero?.status;
  const xeroConnected = workspace.xero?.connected ?? false;
  const xeroReconnect = xeroStatus === 'reconnect_required';
  const stripeRows = workspace.stripe.length
    ? workspace.stripe
    : [{ id: 'none', display_name: null, stripe_account_id: '' }];
  const canAddStripe = workspace.stripe.length < maxStripePerWorkspace;

  const refresh = () => onConnectionsChanged?.();

  const handleConnect = async (provider: 'xero' | 'stripe') => {
    setConnectError(null);

    const popup = prepareOAuthPopup();
    if (!popup) {
      setConnectError(
        'Pop-up blocked. Allow pop-ups for this site to connect accounts.'
      );
      return;
    }

    setConnecting(provider);
    try {
      const result = await connectWorkspaceProvider(
        workspace.id,
        provider,
        popup
      );
      if (result.provider === 'stripe' && result.newConnection) {
        const { connectionId, displayName, stripeAccountId } =
          result.newConnection;
        setNameStripe({
          connectionId,
          suggestedName:
            displayName && displayName !== stripeAccountId
              ? displayName
              : stripeAccountId.startsWith('acct_')
                ? stripeAccountId
                : '',
        });
      } else if (result.provider === 'xero') {
        toast('Xero connected');
      }
      refresh();
    } catch (err) {
      setConnectError(
        err instanceof Error ? err.message : 'Connection failed. Try again.'
      );
    } finally {
      setConnecting(null);
    }
  };

  const disconnect = async () => {
    if (!disconnectTarget) return;
    setDisconnecting(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Workspace-Id': workspace.id,
      };
      const url =
        disconnectTarget.provider === 'xero'
          ? '/api/xero/connections'
          : '/api/stripe/connections';
      const body =
        disconnectTarget.provider === 'stripe'
          ? JSON.stringify({ connectionId: disconnectTarget.connectionId })
          : undefined;

      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers,
        body,
      });
      const data = await res.json();
      if (!data.success) {
        toast(data.error?.message ?? 'Could not disconnect.');
        return;
      }
      toast('Connection removed');
      setDisconnectTarget(null);
      refresh();
    } catch {
      toast('Could not disconnect.');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-[11px] border border-border bg-surface shadow-card">
        <div className="flex items-start justify-between border-b border-border px-4 py-3.5">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">{workspace.name}</h3>
            <p className="mt-0.5 text-[11px] text-text-3">Created {created}</p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-3 hover:bg-bg hover:text-ink"
              aria-label="Workspace menu"
            >
              ⋯
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-20 min-w-[140px] rounded-lg border border-border bg-surface py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setRenameOpen(true);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-xs text-ink hover:bg-bg"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteOpen(true);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-xs text-red hover:bg-red-light"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 py-3">
          {connectError && <Alert variant="error">{connectError}</Alert>}
          <ConnRow
            provider="xero"
            name={
              xeroConnected
                ? (workspace.xero?.tenant_name ?? 'Xero')
                : 'Xero — not connected'
            }
            status={
              xeroReconnect
                ? 'warning'
                : xeroConnected
                  ? workspace.xero?.stale_refresh
                    ? 'warning'
                    : 'connected'
                  : 'disconnected'
            }
            hint={
              xeroReconnect
                ? 'Reconnect required — refresh failed'
                : xeroConnected
                  ? workspace.xero?.stale_refresh
                    ? 'Inactive — use soon or reconnect'
                    : 'Connected'
                  : 'Connect from dashboard or Excel'
            }
            action={
              !xeroConnected || xeroReconnect ? (
                <Button
                  type="button"
                  variant="xero"
                  className="!py-1 !px-2.5 !text-xs shrink-0"
                  disabled={connecting !== null}
                  onClick={() => void handleConnect('xero')}
                >
                  {connecting === 'xero'
                    ? 'Connecting…'
                    : xeroReconnect
                      ? 'Reconnect'
                      : 'Connect'}
                </Button>
              ) : undefined
            }
            menuItems={
              xeroConnected
                ? [
                    {
                      label: 'Remove',
                      danger: true,
                      onClick: () => setDisconnectTarget({ provider: 'xero' }),
                    },
                  ]
                : undefined
            }
          />
          {stripeRows.map((s) => (
            <ConnRow
              key={s.id}
              provider="stripe"
              name={
                s.display_name ?? s.stripe_account_id
                  ? (s.display_name ?? s.stripe_account_id)
                  : 'Stripe — not connected'
              }
              status={s.stripe_account_id ? 'connected' : 'disconnected'}
              hint={
                s.stripe_account_id
                  ? 'Connected'
                  : 'Connect from dashboard or Excel'
              }
              action={
                !s.stripe_account_id ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="!py-1 !px-2.5 !text-xs shrink-0"
                    disabled={connecting !== null}
                    onClick={() => void handleConnect('stripe')}
                  >
                    {connecting === 'stripe' ? 'Connecting…' : 'Connect'}
                  </Button>
                ) : undefined
              }
              menuItems={
                s.stripe_account_id
                  ? [
                      {
                        label: 'Rename',
                        onClick: () =>
                          setRenameStripe({
                            connectionId: s.id,
                            currentName:
                              s.display_name ?? s.stripe_account_id,
                          }),
                      },
                      {
                        label: 'Remove',
                        danger: true,
                        onClick: () =>
                          setDisconnectTarget({
                            provider: 'stripe',
                            connectionId: s.id,
                            label: s.display_name ?? s.stripe_account_id,
                          }),
                      },
                    ]
                  : undefined
              }
            />
          ))}
          {canAddStripe && workspace.stripe.length > 0 && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                className="!py-1 !px-2.5 !text-xs"
                disabled={connecting !== null}
                onClick={() => void handleConnect('stripe')}
              >
                {connecting === 'stripe' ? 'Connecting…' : 'Add Stripe account'}
              </Button>
            </div>
          )}
        </div>

        <WorkspaceTeamFooter workspaceId={workspace.id} onInvite={onInvite} />
      </div>

      <RenameWorkspaceModal
        open={renameOpen}
        workspaceId={workspace.id}
        currentName={workspace.name}
        onClose={() => setRenameOpen(false)}
        onRenamed={refresh}
      />
      <DeleteWorkspaceModal
        open={deleteOpen}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        onClose={() => setDeleteOpen(false)}
        onDeleted={refresh}
      />
      {nameStripe && (
        <NameStripeConnectionModal
          open
          workspaceId={workspace.id}
          connectionId={nameStripe.connectionId}
          suggestedName={nameStripe.suggestedName}
          onClose={() => setNameStripe(null)}
          onSaved={refresh}
        />
      )}
      {renameStripe && (
        <NameStripeConnectionModal
          open
          workspaceId={workspace.id}
          connectionId={renameStripe.connectionId}
          suggestedName={renameStripe.currentName}
          onClose={() => setRenameStripe(null)}
          onSaved={() => {
            toast('Stripe connection renamed');
            refresh();
          }}
        />
      )}
      <DashboardModal
        open={!!disconnectTarget}
        title="Remove connection"
        danger
        onClose={() => setDisconnectTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisconnectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="!bg-red hover:!bg-red/90"
              onClick={() => void disconnect()}
              disabled={disconnecting}
            >
              {disconnecting ? 'Removing…' : 'Remove'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-2">
          {disconnectTarget?.provider === 'xero'
            ? 'Disconnect Xero from this workspace? You can reconnect later.'
            : `Remove Stripe connection "${disconnectTarget && 'label' in disconnectTarget ? disconnectTarget.label : ''}" from this workspace?`}
        </p>
      </DashboardModal>
    </>
  );
}
