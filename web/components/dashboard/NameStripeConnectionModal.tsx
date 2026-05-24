'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { DashboardModal } from './dashboard-ui';

export default function NameStripeConnectionModal({
  open,
  workspaceId,
  connectionId,
  suggestedName,
  onClose,
  onSaved,
}: {
  open: boolean;
  workspaceId: string;
  connectionId: string;
  suggestedName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(suggestedName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setName(suggestedName);
  }, [open, suggestedName]);

  const save = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/connections', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Workspace-Id': workspaceId,
        },
        body: JSON.stringify({
          connectionId,
          displayName: name.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Could not save name.');
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError('Could not save name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardModal
      open={open}
      title="Name Stripe connection"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Skip
          </Button>
          <Button
            variant="primary"
            className="!bg-accent hover:!bg-accent-hover"
            onClick={save}
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Save name'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-2">
        Give this Stripe account a friendly name so your team can recognize it.
      </p>
      <Input
        label="Display name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Acme Corp — Live"
        error={error ?? undefined}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
    </DashboardModal>
  );
}
