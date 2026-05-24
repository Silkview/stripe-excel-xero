'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { DashboardModal, useToast } from './dashboard-ui';

export default function RenameAccountModal({
  open,
  currentName,
  onClose,
  onRenamed,
}: {
  open: boolean;
  currentName: string;
  onClose: () => void;
  onRenamed: (name: string) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError('Account name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Could not rename account.');
        return;
      }
      toast('Account renamed');
      onRenamed(data.data?.name ?? name.trim());
      onClose();
    } catch {
      setError('Could not rename account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardModal
      open={open}
      title="Rename account"
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
        label="Account name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error ?? undefined}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
    </DashboardModal>
  );
}
