'use client';

import Link from 'next/link';
import type { PlanCode } from '@/lib/plans/types';
import { MARKETING_PLANS } from '@/lib/plans/marketing';
import Button from '@/components/ui/Button';

type Props = {
  mode: 'landing' | 'select';
  selectedPlan?: PlanCode;
  onSelect?: (code: PlanCode) => void;
  onContinue?: () => void;
  continueLabel?: string;
};

export default function PlanPricingGrid({
  mode,
  selectedPlan = 'free',
  onSelect,
  onContinue,
  continueLabel,
}: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {MARKETING_PLANS.map((p) => {
        const isSelected = selectedPlan === p.code;
        const cardClass = `relative flex flex-col rounded-lg border p-7 transition-all ${
          p.featured
            ? 'border-accent bg-ink shadow-[0_8px_32px_rgba(37,99,235,0.22)] text-white'
            : isSelected && mode === 'select'
              ? 'border-accent bg-[#EEF4FF] ring-2 ring-accent/30'
              : 'border-rule bg-bg hover:-translate-y-0.5 hover:shadow-card'
        }`;

        const inner = (
          <>
            {p.featured && p.featuredLabel && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                {p.featuredLabel}
              </span>
            )}
            <div
              className={`text-sm font-semibold tracking-tight ${
                p.featured ? 'text-white/70' : 'text-ink-2'
              }`}
            >
              {p.name}
            </div>
            <div className="mt-2 flex items-baseline gap-0.5">
              <span
                className={`font-serif text-4xl font-normal tracking-tight ${
                  p.featured ? 'text-white' : 'text-ink'
                }`}
              >
                {p.price}
              </span>
              {p.period && (
                <span
                  className={`text-sm ${p.featured ? 'text-white/50' : 'text-ink-3'}`}
                >
                  {p.period}
                </span>
              )}
            </div>
            <p
              className={`mt-2 text-xs leading-snug ${
                p.featured ? 'text-white/55' : 'text-ink-3'
              }`}
            >
              {p.tagline}
            </p>
            <ul className="mt-5 flex-1 space-y-2">
              {p.features.map((f) => (
                <li
                  key={f.text}
                  className={`flex items-start gap-2 text-[13px] leading-snug ${
                    f.dimmed
                      ? p.featured
                        ? 'text-white/35'
                        : 'text-ink-3'
                      : p.featured
                        ? 'text-white/85'
                        : 'text-ink-2'
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 font-bold ${
                      f.dimmed
                        ? p.featured
                          ? 'text-white/25'
                          : 'text-ink-3'
                        : p.featured
                          ? 'text-[#93C5FD]'
                          : 'text-accent'
                    }`}
                  >
                    {f.dimmed ? '—' : '✓'}
                  </span>
                  <span className={f.bold ? 'font-medium text-inherit' : ''}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
            {mode === 'landing' ? (
              <Link
                href={`/auth/signup?plan=${p.code}`}
                className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
                  p.featured
                    ? 'bg-white text-accent hover:bg-white/90'
                    : 'border border-rule bg-surface text-ink hover:border-[#C5CBDA] hover:bg-bg'
                }`}
              >
                {p.cta}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onSelect?.(p.code)}
                className={`mt-6 w-full rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-accent text-white'
                    : p.featured
                      ? 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
                      : 'border border-rule bg-surface text-ink hover:border-accent/40'
                }`}
              >
                {isSelected ? 'Selected' : `Choose ${p.name}`}
              </button>
            )}
            <p
              className={`mt-3 text-center text-[11px] ${
                p.featured ? 'text-white/40' : 'text-ink-3'
              }`}
            >
              {p.note}
            </p>
          </>
        );

        if (mode === 'select') {
          return (
            <div key={p.code} className={cardClass}>
              {inner}
            </div>
          );
        }

        return (
          <div key={p.code} className={cardClass}>
            {inner}
          </div>
        );
      })}
      {mode === 'select' && onContinue && (
        <div className="sm:col-span-3">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={onContinue}
          >
            {continueLabel ?? `Continue with ${selectedPlan}`}
          </Button>
        </div>
      )}
    </div>
  );
}
