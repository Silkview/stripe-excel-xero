'use client';

import { useState } from 'react';
import type { WorkspaceSummary } from '@/lib/dashboard/types';
import ConnRow from './ConnRow';
import Button from '@/components/ui/Button';

export default function WorkspaceCard({
  workspace,
  onInvite,
}: {
  workspace: WorkspaceSummary;
  onInvite: (workspaceId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const created = new Date(workspace.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const xeroConnected = !!workspace.xero?.connected;
  const stripeRows = workspace.stripe.length
    ? workspace.stripe
    : [{ id: 'none', display_name: null, stripe_account_id: '' }];

  return (
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
            <div className="absolute right-0 top-8 z-10 min-w-[140px] rounded-lg border border-border bg-surface py-1 shadow-lg">
              <button
                type="button"
                disabled
                className="block w-full px-3 py-1.5 text-left text-xs text-text-3"
              >
                Rename (soon)
              </button>
              <button
                type="button"
                disabled
                className="block w-full px-3 py-1.5 text-left text-xs text-text-3"
              >
                Delete (soon)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        <ConnRow
          provider="xero"
          name={
            xeroConnected
              ? workspace.xero?.tenant_name ?? 'Xero'
              : 'Xero — not connected'
          }
          status={
            xeroConnected
              ? workspace.xero?.token_expiring
                ? 'warning'
                : 'connected'
              : 'disconnected'
          }
          hint={
            xeroConnected
              ? workspace.xero?.token_expiring
                ? 'Token expiring soon — reconnect in Excel'
                : 'Connected'
              : 'Connect in Excel add-in'
          }
        />
        {stripeRows.map((s) => (
          <ConnRow
            key={s.id}
            provider="stripe"
            name={
              s.display_name ?? s.stripe_account_id
                ? `Stripe — ${s.display_name ?? s.stripe_account_id}`
                : 'Stripe — not connected'
            }
            status={s.stripe_account_id ? 'connected' : 'disconnected'}
            hint={
              s.stripe_account_id
                ? 'Connected'
                : 'Connect in Excel add-in'
            }
          />
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border bg-bg/50 px-4 py-3">
        <p className="text-[11px] text-text-3">
          Connections are managed in the Excel add-in
        </p>
        <Button
          variant="secondary"
          className="!py-1 !px-2.5 !text-xs"
          onClick={() => onInvite(workspace.id)}
        >
          Invite user
        </Button>
      </div>
    </div>
  );
}
