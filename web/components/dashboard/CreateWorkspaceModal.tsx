'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { DashboardModal, useToast } from './dashboard-ui';

export default function CreateWorkspaceModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError('Workspace name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Could not create workspace.');
        return;
      }
      toast('Workspace created');
      setName('');
      onClose();
      onCreated();
    } catch {
      setError('Could not create workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardModal
      open={open}
      title="New workspace"
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
            {loading ? 'Creating…' : 'Create workspace'}
          </Button>
        </>
      }
    >
      <Input
        label="Workspace name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Acme Corp"
        error={error ?? undefined}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
    </DashboardModal>
  );
}
