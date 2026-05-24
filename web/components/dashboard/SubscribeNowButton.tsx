'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { PlanCode } from '@/lib/plans/types';
import type { BillingInterval } from '@/lib/plans/pricing';
import { billingIntervalLabel, planPriceDisplay } from '@/lib/plans/pricing';
import { startBillingCheckout } from '@/lib/billing/checkout-client';
import Button from '@/components/ui/Button';
import BillingIntervalToggle from '@/components/billing/BillingIntervalToggle';
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
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan: 'pro' | 'firm' =
    planProp === 'firm' || planProp === 'pro'
      ? planProp
      : ctx.planCode === 'firm' || ctx.planCode === 'pro'
        ? ctx.planCode
        : 'pro';

  const { price, period } = planPriceDisplay(plan, interval);

  const subscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await startBillingCheckout(plan, interval);
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setError(result.error ?? 'Could not start checkout.');
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
    <div className={className}>
      <BillingIntervalToggle
        value={interval}
        onChange={setInterval}
        size="sm"
        className="mb-3"
      />
      <p className="mb-2 text-xs text-text-3">
        {planDisplayName(plan)} — {price}
        {period} ({billingIntervalLabel(interval).toLowerCase()})
      </p>
      <DirectSubscribeButton
        variant={variant}
        loading={loading}
        error={error}
        interval={interval}
        onSubscribe={() => void subscribe()}
      />
    </div>
  );
}

function planDisplayName(plan: 'pro' | 'firm'): string {
  return plan === 'firm' ? 'Firm' : 'Pro';
}

function DirectSubscribeButton({
  variant,
  loading,
  error,
  interval,
  onSubscribe,
}: {
  variant: 'primary' | 'secondary';
  loading: boolean;
  error: string | null;
  interval: BillingInterval;
  onSubscribe: () => void;
}) {
  return (
    <div>
      <Button
        variant={variant}
        className={
          variant === 'primary'
            ? '!bg-accent hover:!bg-accent-hover w-full sm:w-auto'
            : 'w-full sm:w-auto'
        }
        onClick={onSubscribe}
        disabled={loading}
      >
        {loading
          ? 'Opening checkout…'
          : `Subscribe ${billingIntervalLabel(interval).toLowerCase()}`}
      </Button>
      {error && <p className="mt-2 text-xs text-warn">{error}</p>}
    </div>
  );
}
