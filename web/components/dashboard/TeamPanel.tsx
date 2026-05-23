'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TeamInviteRow, TeamMemberRow } from '@/lib/dashboard/team';
import type { WorkspaceSummary } from '@/lib/dashboard/types';
import Button from '@/components/ui/Button';
import { PageHeader, Pill, useToast } from './dashboard-ui';
import InviteMemberModal from './InviteMemberModal';

type TeamRow = (TeamMemberRow | TeamInviteRow) & { key: string };

function rolePillVariant(role: string): 'owner' | 'admin' | 'member' {
  if (role === 'owner') return 'owner';
  if (role === 'admin') return 'admin';
  return 'member';
}

export default function TeamPanel() {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [invites, setInvites] = useState<TeamInviteRow[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, wsRes] = await Promise.all([
        fetch('/api/account/team'),
        fetch('/api/workspace'),
      ]);
      const team = await teamRes.json();
      const ws = await wsRes.json();
      if (team.success) {
        setMembers(team.data?.members ?? []);
        setInvites(team.data?.invites ?? []);
      }
      if (ws.success) {
        setWorkspaces(ws.data?.workspaces ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = async (id: string) => {
    const res = await fetch(`/api/account/invitations/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success) {
      toast('Invitation revoked');
      load();
    } else {
      toast(data.error?.message ?? 'Could not revoke');
    }
  };

  const copyInviteLink = (token: string) => {
    const base = window.location.origin;
    const link = `${base}/auth/invite?token=${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(link);
    toast('Invite link copied');
  };

  const rows: TeamRow[] = [
    ...members.map((m) => ({ ...m, key: `m-${m.id}` })),
    ...invites.map((i) => ({ ...i, key: `i-${i.id}` })),
  ];

  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Invite colleagues and control which workspaces they can access."
        action={
          <Button
            variant="primary"
            className="!bg-accent hover:!bg-accent-hover"
            onClick={() => setInviteOpen(true)}
          >
            Invite member
          </Button>
        }
      />

      <div className="overflow-hidden rounded-[11px] border border-border bg-surface shadow-card">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-bg/80 text-[11px] font-medium uppercase tracking-wide text-text-3">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Workspaces</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-text-2">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && !rows.length && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-text-2">
                  No team members yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-ink">
                    {row.type === 'member' ? row.name : row.email}
                  </div>
                  <div className="text-[11px] text-text-3">{row.email}</div>
                </td>
                <td className="px-5 py-3.5">
                  <Pill variant={rolePillVariant(row.role)}>{row.role}</Pill>
                </td>
                <td className="px-5 py-3.5 text-text-2">
                  {row.workspaceNames.length
                    ? row.workspaceNames.join(', ')
                    : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <Pill variant={row.status === 'pending' ? 'pending' : 'active'}>
                    {row.status}
                  </Pill>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {row.type === 'invite' && (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="text-xs text-accent hover:underline"
                        onClick={() => copyInviteLink(row.token)}
                      >
                        Copy link
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red hover:underline"
                        onClick={() => revoke(row.id)}
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        workspaces={workspaces}
        onInvited={load}
      />
    </>
  );
}
