'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { WorkspaceSummary } from '@/lib/dashboard/types';
import { DashboardModal, useToast } from './dashboard-ui';

export default function InviteMemberModal({
  open,
  onClose,
  workspaces,
  preselectedWorkspaceId,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  workspaces: WorkspaceSummary[];
  preselectedWorkspaceId?: string;
  onInvited: () => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (open) {
      setInviteLink(null);
      setEmailSent(false);
      setError(null);
      if (preselectedWorkspaceId) {
        setSelected([preselectedWorkspaceId]);
      } else {
        setSelected([]);
      }
    }
  }, [open, preselectedWorkspaceId]);

  const toggleWorkspace = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const submit = async () => {
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!selected.length) {
      setError('Select at least one workspace.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          role,
          workspaceIds: selected,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Could not send invite.');
        return;
      }
      const link = data.data?.inviteLink as string | undefined;
      const sent = data.data?.emailSent === true;
      if (link) setInviteLink(link);
      setEmailSent(sent);
      toast(
        sent
          ? `Invitation email sent to ${email.trim()}`
          : `Invitation created for ${email.trim()}`
      );
      onInvited();
    } catch {
      setError('Could not send invite.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    toast('Invite link copied');
  };

  const resetForm = () => {
    setInviteLink(null);
    setEmailSent(false);
    setEmail('');
    setSelected(preselectedWorkspaceId ? [preselectedWorkspaceId] : []);
  };

  return (
    <DashboardModal
      open={open}
      title="Invite team member"
      onClose={onClose}
      footer={
        inviteLink ? (
          <>
            <Button variant="secondary" onClick={resetForm}>
              Invite another
            </Button>
            <Button variant="primary" className="!bg-accent" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="!bg-accent hover:!bg-accent-hover"
              onClick={submit}
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send invite'}
            </Button>
          </>
        )
      }
    >
      {inviteLink ? (
        <div>
          <p className="text-sm text-text-2">
            {emailSent ? (
              <>
                We emailed <strong>{email}</strong> a link to create their account
                and join your team.
              </>
            ) : (
              <>
                Email could not be sent (check Resend configuration). Share this
                link with <strong>{email}</strong> manually.
              </>
            )}
          </p>
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 rounded-sm border border-border bg-bg px-3 py-2 font-mono text-xs"
            />
            <Button variant="secondary" onClick={copyLink}>
              Copy link
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@firm.com"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">
              Role
            </label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as 'member' | 'admin')
              }
              className="w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              Workspaces
            </label>
            <div className="flex flex-wrap gap-2">
              {workspaces.map((ws) => {
                const on = selected.includes(ws.id);
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => toggleWorkspace(ws.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      on
                        ? 'border-accent bg-accent-light text-accent'
                        : 'border-border bg-bg text-text-2 hover:border-accent/40'
                    }`}
                  >
                    {ws.name}
                  </button>
                );
              })}
            </div>
            {error && (
              <p className="mt-2 text-xs text-warn">{error}</p>
            )}
          </div>
        </>
      )}
    </DashboardModal>
  );
}
