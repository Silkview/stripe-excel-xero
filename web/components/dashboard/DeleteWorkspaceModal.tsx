'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { DashboardModal, useToast } from './dashboard-ui';

export default function DeleteWorkspaceModal({
  open,
  workspaceId,
  workspaceName,
  onClose,
  onDeleted,
}: {
  open: boolean;
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Could not delete workspace.');
        return;
      }
      toast('Workspace deleted');
      onClose();
      onDeleted();
    } catch {
      setError('Could not delete workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardModal
      open={open}
      title="Delete workspace"
      danger
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="!bg-red hover:!bg-red/90"
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Delete workspace'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-2">
        Delete <span className="font-medium text-ink">{workspaceName}</span>?
        This removes all Xero and Stripe connections for this workspace. This
        cannot be undone.
      </p>
      {error && <p className="text-sm text-red">{error}</p>}
    </DashboardModal>
  );
}
