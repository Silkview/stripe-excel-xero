'use client';

import { useEffect, useState } from 'react';
import { Pill } from './dashboard-ui';

type Member = {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
};

function roleVariant(role: string): 'owner' | 'admin' | 'member' {
  if (role === 'owner') return 'owner';
  if (role === 'admin') return 'admin';
  return 'member';
}

function roleLabel(role: string): string {
  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Admin';
  return 'Member';
}

export default function WorkspaceTeamFooter({
  workspaceId,
  onInvite,
}: {
  workspaceId: string;
  onInvite: (workspaceId: string) => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/members`);
        const data = await res.json();
        if (!cancelled && data.success) {
          setMembers(data.data?.members ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const hasAccountWide = members.some(
    (m) => m.role === 'owner' || m.role === 'admin'
  );

  return (
    <div className="mt-auto border-t border-border bg-bg/50 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-3">
          Team on this workspace
        </p>
        <button
          type="button"
          onClick={() => onInvite(workspaceId)}
          className="text-[11px] font-medium text-accent hover:underline"
        >
          Invite user
        </button>
      </div>
      {loading ? (
        <p className="text-[11px] text-text-3">Loading team…</p>
      ) : members.length === 0 ? (
        <p className="text-[11px] text-text-3">No members assigned yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-light text-[10px] font-semibold text-accent">
                {m.initials}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink">
                {m.email}
              </span>
              <Pill variant={roleVariant(m.role)}>{roleLabel(m.role)}</Pill>
            </li>
          ))}
        </ul>
      )}
      {hasAccountWide && (
        <p className="mt-2 text-[10.5px] text-text-3">
          Owners and admins have access to all workspaces.
        </p>
      )}
    </div>
  );
}
