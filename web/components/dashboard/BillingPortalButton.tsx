'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import SubscribeNowButton from './SubscribeNowButton';

export default function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSubscribe, setNeedsSubscribe] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    setNeedsSubscribe(false);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
        return;
      }
      const message = data.error?.message ?? 'Could not open billing portal.';
      setError(message);
      if (
        data.error?.code === 'BILLING_REQUIRED' ||
        message.toLowerCase().includes('customer') ||
        message.toLowerCase().includes('billing')
      ) {
        setNeedsSubscribe(true);
      }
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
        <p className="mt-2 text-xs text-warn">
          {error}
          {needsSubscribe && (
            <span className="mt-2 block">
              Subscribe first to access billing management.
            </span>
          )}
        </p>
      )}
      {needsSubscribe && (
        <div className="mt-2">
          <SubscribeNowButton variant="secondary" />
        </div>
      )}
    </div>
  );
}

