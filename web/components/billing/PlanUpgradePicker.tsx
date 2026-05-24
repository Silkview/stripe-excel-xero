'use client';

import { useState } from 'react';
import type { PlanCode } from '@/lib/plans/types';
import type { BillingInterval } from '@/lib/plans/pricing';
import { billingIntervalLabel } from '@/lib/plans/pricing';
import { marketingPlansForInterval } from '@/lib/plans/marketing';
import { startBillingCheckout } from '@/lib/billing/checkout-client';
import Button from '@/components/ui/Button';
import BillingIntervalToggle from '@/components/billing/BillingIntervalToggle';

const PAID_PLAN_CODES: PlanCode[] = ['pro', 'firm'];

type PlanUpgradePickerProps = {
  defaultPlan?: 'pro' | 'firm';
  compact?: boolean;
  className?: string;
  onCheckout?: (
    plan: 'pro' | 'firm',
    interval: BillingInterval
  ) => void | Promise<void>;
  submitLabel?: string;
};

export function PlanSelectGrid({
  plans,
  selectedPlan,
  onSelectPlan,
  compact = false,
}: {
  plans: ReturnType<typeof marketingPlansForInterval>;
  selectedPlan: PlanCode;
  onSelectPlan: (plan: PlanCode) => void;
  compact?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
      {plans.map((p) => (
        <button
          key={p.code}
          type="button"
          onClick={() => onSelectPlan(p.code)}
          className={`rounded-lg border text-left transition-all ${
            compact ? 'p-3' : 'p-4 sm:p-6'
          } ${
            selectedPlan === p.code
              ? 'border-accent bg-[#EEF4FF] ring-2 ring-accent/30'
              : 'border-rule hover:border-accent/40 bg-surface'
          }`}
        >
          <span className="font-semibold text-ink">{p.name}</span>
          <span
            className={`mt-1 block font-serif text-ink ${
              compact ? 'text-lg' : 'text-2xl sm:text-3xl'
            }`}
          >
            {p.price}
            <span className="text-xs font-sans text-text-3">{p.period}</span>
          </span>
          {!compact && (
            <span className="mt-1 block text-xs text-text-3">{p.tagline}</span>
          )}
          <span className="mt-2 block text-xs font-medium text-accent">
            {selectedPlan === p.code ? 'Selected' : `Choose ${p.name}`}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function PlanUpgradePicker({
  defaultPlan = 'pro',
  compact = false,
  className = '',
  onCheckout,
  submitLabel,
}: PlanUpgradePickerProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>(defaultPlan);
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plans = marketingPlansForInterval(interval).filter((p) =>
    PAID_PLAN_CODES.includes(p.code)
  );

  const checkout = async () => {
    if (selectedPlan !== 'pro' && selectedPlan !== 'firm') return;
    setLoading(true);
    setError(null);
    try {
      if (onCheckout) {
        await onCheckout(selectedPlan, interval);
        return;
      }
      const result = await startBillingCheckout(selectedPlan, interval);
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

  const label =
    submitLabel ??
    (loading
      ? 'Opening checkout…'
      : `Subscribe to ${selectedPlan} (${billingIntervalLabel(interval).toLowerCase()})`);

  return (
    <div className={className}>
      <BillingIntervalToggle
        value={interval}
        onChange={setInterval}
        size={compact ? 'sm' : 'md'}
        className={compact ? 'mb-3' : 'mb-4'}
      />
      <PlanSelectGrid
        plans={plans}
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        compact={compact}
      />
      <Button
        variant="primary"
        className={`mt-4 !bg-accent hover:!bg-accent-hover ${compact ? '!py-1.5 !px-3 !text-xs' : ''}`}
        disabled={loading}
        onClick={() => void checkout()}
      >
        {label}
      </Button>
      {error && (
        <p className={`mt-2 text-warn ${compact ? 'text-xs' : 'text-sm'}`}>
          {error}
        </p>
      )}
    </div>
  );
}
