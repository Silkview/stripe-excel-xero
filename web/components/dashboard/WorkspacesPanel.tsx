'use client';

import { useCallback, useEffect, useState } from 'react';
import type { WorkspaceSummary } from '@/lib/dashboard/types';
import { useDashboard, PageHeader } from './dashboard-ui';
import PlanLimitBar from './PlanLimitBar';
import WorkspaceGrid from './WorkspaceGrid';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import InviteMemberModal from './InviteMemberModal';

export default function WorkspacesPanel() {
  const ctx = useDashboard();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workspace');
      const data = await res.json();
      if (data.success) {
        setWorkspaces(data.data?.workspaces ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openInvite = (workspaceId: string) => {
    setInviteWorkspaceId(workspaceId);
    setInviteOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Workspaces"
        subtitle="Manage workspaces and connect Xero or Stripe for each client."
      />
      <PlanLimitBar />
      {loading ? (
        <p className="text-sm text-text-2">Loading workspaces…</p>
      ) : (
        <WorkspaceGrid
          workspaces={workspaces}
          canManage={ctx.isAdmin}
          maxStripePerWorkspace={ctx.limits.maxStripeConnectionsPerWorkspace}
          onInvite={openInvite}
          onAdd={() => setCreateOpen(true)}
          onConnectionsChanged={load}
        />
      )}
      {ctx.isAdmin && (
        <>
          <CreateWorkspaceModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreated={load}
          />
          <InviteMemberModal
            open={inviteOpen}
            onClose={() => {
              setInviteOpen(false);
              setInviteWorkspaceId(undefined);
            }}
            workspaces={workspaces}
            preselectedWorkspaceId={inviteWorkspaceId}
            onInvited={load}
          />
        </>
      )}
    </>
  );
}
