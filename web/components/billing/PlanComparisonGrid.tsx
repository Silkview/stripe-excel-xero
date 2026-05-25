'use client';

import { useEffect, useState } from 'react';
import type { PlanCode } from '@/lib/plans/types';
import {
  type BillingInterval,
  billingIntervalLabel,
} from '@/lib/plans/pricing';
import { marketingPlansForInterval } from '@/lib/plans/marketing';
import BillingIntervalToggle from '@/components/billing/BillingIntervalToggle';

type CtaIntent =
  | 'current'
  | 'switch_interval'
  | 'switch_plan'
  | 'subscribe'
  | 'downgrade_to_free'
  | 'admin_locked';

type Props = {
  currentPlan: PlanCode;
  currentInterval: BillingInterval | null;
  isAdmin: boolean;
  pendingPlan?: PlanCode | null;
  onSwitch: (plan: 'pro' | 'firm', interval: BillingInterval) => void | Promise<void>;
  onDowngradeToFree: () => void | Promise<void>;
};

function ctaIntent(args: {
  cardPlan: PlanCode;
  cardInterval: BillingInterval;
  currentPlan: PlanCode;
  currentInterval: BillingInterval | null;
  isAdmin: boolean;
}): CtaIntent {
  const { cardPlan, cardInterval, currentPlan, currentInterval, isAdmin } = args;
  if (!isAdmin) return 'admin_locked';

  if (cardPlan === currentPlan) {
    if (cardPlan === 'free') return 'current';
    if (currentInterval && cardInterval === currentInterval) return 'current';
    if (currentInterval) return 'switch_interval';
    return 'subscribe';
  }

  if (cardPlan === 'free') return 'downgrade_to_free';
  if (currentPlan === 'free') return 'subscribe';
  return 'switch_plan';
}

function ctaLabel(intent: CtaIntent, planName: string, interval: BillingInterval): string {
  switch (intent) {
    case 'current':
      return 'Current plan';
    case 'switch_interval':
      return `Switch to ${billingIntervalLabel(interval).toLowerCase()}`;
    case 'switch_plan':
      return `Switch to ${planName}`;
    case 'subscribe':
      return `Subscribe to ${planName}`;
    case 'downgrade_to_free':
      return 'Downgrade to Free';
    case 'admin_locked':
      return 'Admin only';
  }
}

export default function PlanComparisonGrid({
  currentPlan,
  currentInterval,
  isAdmin,
  pendingPlan,
  onSwitch,
  onDowngradeToFree,
}: Props) {
  const [interval, setInterval] = useState<BillingInterval>(
    currentInterval ?? 'monthly'
  );

  useEffect(() => {
    if (currentInterval) setInterval(currentInterval);
  }, [currentInterval]);

  const plans = marketingPlansForInterval(interval);

  const handleClick = async (plan: PlanCode, intent: CtaIntent) => {
    if (intent === 'current' || intent === 'admin_locked') return;
    if (intent === 'downgrade_to_free') {
      await onDowngradeToFree();
      return;
    }
    if (plan === 'pro' || plan === 'firm') {
      await onSwitch(plan, interval);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">Plans</h3>
        <BillingIntervalToggle
          value={interval}
          onChange={setInterval}
          size="sm"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => {
          const intent = ctaIntent({
            cardPlan: p.code,
            cardInterval: interval,
            currentPlan,
            currentInterval,
            isAdmin,
          });
          const isCurrent = intent === 'current';
          const disabled =
            intent === 'current' ||
            intent === 'admin_locked' ||
            pendingPlan === p.code;
          const isFeatured = p.featured && !isCurrent;

          return (
            <article
              key={p.code}
              className={`relative flex flex-col rounded-[11px] border bg-surface p-5 shadow-card ${
                isCurrent
                  ? 'border-accent ring-2 ring-accent/30'
                  : isFeatured
                    ? 'border-accent/40'
                    : 'border-rule'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Your plan
                </span>
              )}
              {!isCurrent && p.featuredLabel && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {p.featuredLabel}
                </span>
              )}

              <header>
                <h4 className="text-base font-semibold text-ink">{p.name}</h4>
                <p className="mt-1 font-serif text-2xl text-ink">
                  {p.price}
                  <span className="ml-0.5 text-xs font-sans text-text-3">
                    {p.period}
                  </span>
                </p>
                <p className="mt-1 text-xs text-text-3">{p.tagline}</p>
              </header>

              <ul className="mt-4 space-y-1.5 text-[13px] text-ink-2">
                {p.features.map((f) => (
                  <li
                    key={f.text}
                    className={`flex gap-2 ${f.dimmed ? 'opacity-60' : ''}`}
                  >
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    <span className={f.bold ? 'font-medium text-ink' : ''}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => void handleClick(p.code, intent)}
                  disabled={disabled}
                  className={`w-full rounded-[9px] px-3 py-2 text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'cursor-default border border-accent/40 bg-accent/5 text-accent'
                      : intent === 'downgrade_to_free'
                        ? 'border border-rule bg-surface text-ink-2 hover:bg-bg disabled:opacity-50'
                        : 'bg-accent text-white hover:bg-accent-hover disabled:opacity-50'
                  }`}
                >
                  {pendingPlan === p.code
                    ? 'Working…'
                    : ctaLabel(intent, p.name, interval)}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
