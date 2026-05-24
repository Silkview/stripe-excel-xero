'use client';

import type { BillingInterval } from '@/lib/plans/pricing';
import { billingIntervalLabel } from '@/lib/plans/pricing';

type Props = {
  value: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  className?: string;
  size?: 'sm' | 'md';
};

export default function BillingIntervalToggle({
  value,
  onChange,
  className = '',
  size = 'md',
}: Props) {
  const pad = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm';

  return (
    <div
      role="group"
      aria-label="Billing interval"
      className={`inline-flex rounded-lg border border-rule bg-surface p-0.5 ${className}`}
    >
      {(['monthly', 'annual'] as const).map((interval) => {
        const selected = value === interval;
        return (
          <button
            key={interval}
            type="button"
            onClick={() => onChange(interval)}
            className={`rounded-md font-medium transition-colors ${pad} ${
              selected
                ? 'bg-accent text-white shadow-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            {billingIntervalLabel(interval)}
            {interval === 'annual' && (
              <span
                className={`ml-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                  selected ? 'text-white/80' : 'text-accent'
                }`}
              >
                Save
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
