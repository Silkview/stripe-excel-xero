'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
        return;
      }
      setError(data.error?.message ?? 'Could not open billing portal.');
    } catch {
      setError('Could not open billing portal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant="secondary" onClick={openPortal} disabled={loading}>
        {loading ? 'Opening…' : 'Manage billing'}
      </Button>
      {error && (
        <p className="mt-2 text-xs text-warn">{error}</p>
      )}
    </div>
  );
}
