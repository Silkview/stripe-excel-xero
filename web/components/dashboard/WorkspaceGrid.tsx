'use client';

import type { WorkspaceSummary } from '@/lib/dashboard/types';
import WorkspaceCard from './WorkspaceCard';

export default function WorkspaceGrid({
  workspaces,
  canManage,
  maxStripePerWorkspace = 1,
  onInvite,
  onAdd,
  onConnectionsChanged,
}: {
  workspaces: WorkspaceSummary[];
  canManage: boolean;
  maxStripePerWorkspace?: number;
  onInvite: (workspaceId: string) => void;
  onAdd: () => void;
  onConnectionsChanged?: () => void;
}) {
  if (!canManage) {
    return (
      <div className="flex flex-col gap-3">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="rounded-[11px] border border-border bg-surface px-5 py-4"
          >
            <h3 className="font-semibold text-ink">{ws.name}</h3>
            <p className="mt-2 text-xs text-text-3">
              Xero: {ws.xero?.connected ? ws.xero.tenant_name : 'Not connected'}
              {' · '}
              Stripe:{' '}
              {ws.stripe.length
                ? ws.stripe.map((s) => s.display_name ?? s.stripe_account_id).join(', ')
                : 'Not connected'}
            </p>
          </div>
        ))}
        {!workspaces.length && (
          <p className="text-sm text-text-2">
            No workspaces assigned yet. Ask your account admin for access.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {workspaces.map((ws) => (
        <WorkspaceCard
          key={ws.id}
          workspace={ws}
          maxStripePerWorkspace={maxStripePerWorkspace}
          onInvite={onInvite}
          onConnectionsChanged={onConnectionsChanged}
        />
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex min-h-[200px] flex-col items-center justify-center rounded-[11px] border-2 border-dashed border-border bg-transparent text-text-3 transition-colors hover:border-accent hover:bg-accent-light/30 hover:text-accent"
      >
        <span className="text-2xl leading-none">+</span>
        <span className="mt-2 text-sm font-medium">Add workspace</span>
      </button>
    </div>
  );
}
