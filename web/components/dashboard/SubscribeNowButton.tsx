'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { PlanCode } from '@/lib/plans/types';
import Button from '@/components/ui/Button';
import { useDashboard } from './dashboard-ui';

export default function SubscribeNowButton({
  className = '',
  variant = 'primary',
  useBillingPage = false,
  plan: planProp,
}: {
  className?: string;
  variant?: 'primary' | 'secondary';
  /** When true, link to billing page for plan picker (paywall only). */
  useBillingPage?: boolean;
  plan?: PlanCode;
}) {
  const ctx = useDashboard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan: 'pro' | 'firm' =
    planProp === 'firm' || planProp === 'pro'
      ? planProp
      : ctx.planCode === 'firm' || ctx.planCode === 'pro'
        ? ctx.planCode
        : 'pro';

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

  if (useBillingPage || ctx.billingBlocked) {
    return (
      <Link
        href="/dashboard/billing"
        className={
          variant === 'primary'
            ? `inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover ${className}`
            : `inline-flex items-center justify-center rounded-lg border border-rule bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-accent/40 ${className}`
        }
      >
        {ctx.billingBlocked ? 'Choose a plan' : 'Subscribe now'}
      </Link>
    );
  }

  return (
    <DirectSubscribeButton
      variant={variant}
      className={className}
      loading={loading}
      error={error}
      onSubscribe={() => void subscribe()}
    />
  );
}

function DirectSubscribeButton({
  variant,
  className,
  loading,
  error,
  onSubscribe,
}: {
  variant: 'primary' | 'secondary';
  className: string;
  loading: boolean;
  error: string | null;
  onSubscribe: () => void;
}) {
  return (
    <div>
      <Button
        variant={variant}
        className={
          variant === 'primary'
            ? `!bg-accent hover:!bg-accent-hover ${className}`
            : className
        }
        onClick={onSubscribe}
        disabled={loading}
      >
        {loading ? 'Opening checkout…' : 'Subscribe now'}
      </Button>
      {error && <p className="mt-2 text-xs text-warn">{error}</p>}
    </div>
  );
}
