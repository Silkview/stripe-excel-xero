'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { DashboardModal, useToast } from './dashboard-ui';

export default function RenameWorkspaceModal({
  open,
  workspaceId,
  currentName,
  onClose,
  onRenamed,
}: {
  open: boolean;
  workspaceId: string;
  currentName: string;
  onClose: () => void;
  onRenamed: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  const submit = async () => {
    if (!name.trim()) {
      setError('Workspace name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Could not rename workspace.');
        return;
      }
      toast('Workspace renamed');
      onClose();
      onRenamed();
    } catch {
      setError('Could not rename workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardModal
      open={open}
      title="Rename workspace"
      onClose={onClose}
      footer={
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
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <Input
        label="Workspace name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error ?? undefined}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
    </DashboardModal>
  );
}
