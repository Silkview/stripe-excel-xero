'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useDashboard } from './dashboard-ui';

export default function SubscribeNowButton({
  className = '',
  variant = 'primary',
}: {
  className?: string;
  variant?: 'primary' | 'secondary';
}) {
  const ctx = useDashboard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan =
    ctx.planCode === 'firm' || ctx.planCode === 'pro' ? ctx.planCode : 'pro';

  const subscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
        return;
      }
      setError(data.error?.message ?? 'Could not start checkout.');
    } catch {
      setError('Could not start checkout.');
    } finally {
      setLoading(false);
    }
  };

  if (!ctx.isAdmin) return null;

  return (
    <div>
      <Button
        variant={variant}
        className={
          variant === 'primary'
            ? `!bg-accent hover:!bg-accent-hover ${className}`
            : className
        }
        onClick={subscribe}
        disabled={loading}
      >
        {loading ? 'Opening checkout…' : 'Subscribe now'}
      </Button>
      {error && <p className="mt-2 text-xs text-warn">{error}</p>}
    </div>
  );
}
