'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useDashboard } from './dashboard-ui';

export default function CancelSubscriptionButton() {
  const router = useRouter();
  const { refreshBillingContext } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    const ok = window.confirm(
      "Cancel your paid plan and revert to Free? You'll lose Xero push and higher transaction limits immediately."
    );
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Could not cancel subscription.');
        return;
      }
      await refreshBillingContext();
      router.refresh();
    } catch {
      setError('Could not cancel subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="secondary"
        onClick={() => void handleCancel()}
        disabled={loading}
        className="!border-red/40 !text-red hover:!bg-red-light"
      >
        {loading ? 'Cancelling…' : 'Cancel & switch to Free'}
      </Button>
      {error && <p className="mt-2 text-xs text-red">{error}</p>}
    </div>
  );
}
