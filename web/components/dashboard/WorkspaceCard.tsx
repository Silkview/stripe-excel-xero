'use client';

import { useState, useEffect } from 'react';
import type { ManualJournalPostMode } from '@stripesync/shared';
import type { WorkspaceSummary } from '@/lib/dashboard/types';
import { connectWorkspaceProvider, prepareOAuthPopup } from '@/lib/dashboard/oauth-connect';
import WorkspaceConnections from './WorkspaceConnections';
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
  const [journalPostMode, setJournalPostMode] = useState<ManualJournalPostMode>(
    workspace.manualJournalPostMode
  );
  const [savingJournalMode, setSavingJournalMode] = useState(false);

  useEffect(() => {
    setJournalPostMode(workspace.manualJournalPostMode ?? 'draft_and_post');
  }, [workspace.id, workspace.manualJournalPostMode]);

  const created = new Date(workspace.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const refresh = () => onConnectionsChanged?.();

  const handleJournalPostModeChange = async (mode: ManualJournalPostMode) => {
    const previous = journalPostMode;
    setJournalPostMode(mode);
    setSavingJournalMode(true);
    try {
      const res = await fetch(`/api/workspace/${workspace.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualJournalPostMode: mode }),
      });
      const data = await res.json();
      if (!data.success) {
        setJournalPostMode(previous);
        toast(data.error?.message ?? 'Could not save journal posting setting.');
        return;
      }
      toast('Journal posting setting saved');
      refresh();
    } catch {
      setJournalPostMode(previous);
      toast('Could not save journal posting setting.');
    } finally {
      setSavingJournalMode(false);
    }
  };

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
          <WorkspaceConnections
            workspace={workspace}
            maxStripePerWorkspace={maxStripePerWorkspace}
            connecting={connecting}
            onConnectXero={() => void handleConnect('xero')}
            onConnectStripe={() => void handleConnect('stripe')}
            onDisconnectXero={() => setDisconnectTarget({ provider: 'xero' })}
            onDisconnectStripe={(connectionId, label) =>
              setDisconnectTarget({ provider: 'stripe', connectionId, label })
            }
            onRenameStripe={(connectionId, currentName) =>
              setRenameStripe({ connectionId, currentName })
            }
          />
        </div>

        <div className="border-t border-border px-4 py-3">
          <label className="mb-1.5 block text-[11px] font-medium text-text-2">
            Manual journal posting
          </label>
          <select
            value={journalPostMode}
            onChange={(e) =>
              void handleJournalPostModeChange(
                e.target.value as ManualJournalPostMode
              )
            }
            disabled={savingJournalMode}
            className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-ink disabled:opacity-50"
          >
            <option value="draft_only">Draft only</option>
            <option value="draft_and_post">Draft and Post</option>
          </select>
          <p className="mt-1 text-[10.5px] text-text-3">
            {journalPostMode === 'draft_only'
              ? 'Excel push is limited to Draft journals for this workspace.'
              : 'Excel push can post journals as Draft or Posted.'}
          </p>
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
