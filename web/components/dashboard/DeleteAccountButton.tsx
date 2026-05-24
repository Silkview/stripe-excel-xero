'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { DashboardModal } from './dashboard-ui';

export default function DeleteAccountButton({
  accountName,
  className = '',
}: {
  accountName: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText === accountName;

  const deleteAccount = async () => {
    if (!canDelete) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Could not delete account.');
        return;
      }
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      setError('Could not delete account.');
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setOpen(false);
    setConfirmText('');
    setError(null);
  };

  return (
    <>
      <Button
        variant="secondary"
        className={`!border-red !text-red hover:!bg-red-light ${className}`}
        onClick={() => setOpen(true)}
      >
        Delete account
      </Button>

      <DashboardModal
        open={open}
        title="Delete account"
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="!bg-red hover:!bg-red/90"
              onClick={() => void deleteAccount()}
              disabled={!canDelete || loading}
            >
              {loading ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-2 mb-4">
          This permanently deletes your account, all workspaces, connections,
          and team members. This cannot be undone.
        </p>
        <p className="text-sm mb-2">
          Type <strong>{accountName}</strong> to confirm:
        </p>
        <Input
          label="Account name"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          error={error ?? undefined}
        />
      </DashboardModal>
    </>
  );
}
