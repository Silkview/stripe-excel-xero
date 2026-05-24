'use client';

import { useState } from 'react';
import type { PlanCode } from '@/lib/plans/types';
import { MARKETING_PLANS } from '@/lib/plans/marketing';
import Button from '@/components/ui/Button';
import { useDashboard, PageHeader } from './dashboard-ui';
import BillingPortalButton from './BillingPortalButton';
import DeleteAccountButton from './DeleteAccountButton';

const PAID_PLANS = MARKETING_PLANS.filter(
  (p) => p.code === 'pro' || p.code === 'firm'
);

export default function BillingPaywall() {
  const ctx = useDashboard();
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>('pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headline =
    ctx.billingAccess === 'payment_required'
      ? 'Your subscription is inactive'
      : 'Your trial has ended';

  const subtitle =
    ctx.billingAccess === 'payment_required'
      ? 'Update your payment method or choose a plan to continue using Silkview Connect.'
      : 'Subscribe to Pro or Firm to keep syncing Stripe and Xero data, or delete your account.';

  const subscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
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

  return (
    <>
      <PageHeader title="Billing" subtitle={subtitle} />

      <PaywallBanner headline={headline} subtitle={subtitle} />

      {ctx.isAdmin ? (
        <>
          <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
            {PAID_PLANS.map((p) => {
              const isSelected = selectedPlan === p.code;
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => setSelectedPlan(p.code)}
                  className={`relative flex flex-col rounded-lg border p-6 text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-[#EEF4FF] ring-2 ring-accent/30'
                      : 'border-rule bg-surface hover:border-accent/40'
                  }`}
                >
                  <div className="text-sm font-semibold text-ink-2">{p.name}</div>
                  <PaywallPrice price={p.price} period={p.period} />
                  <p className="mt-2 text-xs text-ink-3">{p.tagline}</p>
                  <ul className="mt-4 space-y-1.5">
                    {p.features.slice(0, 4).map((f) => (
                      <li key={f.text} className="text-[13px] text-ink-2">
                        ✓ {f.text}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-4 text-xs font-medium text-accent">
                    {isSelected ? 'Selected' : `Choose ${p.name}`}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              className="!bg-accent hover:!bg-accent-hover"
              onClick={() => void subscribe()}
              disabled={loading}
            >
              {loading ? 'Opening checkout…' : `Subscribe to ${selectedPlan}`}
            </Button>
            {ctx.hasStripeCustomer && <BillingPortalButton />}
          </div>
          {error && <p className="mt-3 text-sm text-warn">{error}</p>}
        </>
      ) : (
        <p className="text-sm text-text-2">
          Contact your account admin to subscribe or manage billing.
        </p>
      )}

      {ctx.isAdmin && (
        <section className="mt-10 max-w-3xl rounded-[11px] border border-red/30 bg-red-light/40 p-6">
          <h2 className="text-[15px] font-semibold text-red">Delete account</h2>
          <p className="mt-2 text-sm text-text-2">
            Prefer not to subscribe? You can permanently delete your account and
            all associated data.
          </p>
          <DeleteAccountButton
            accountName={ctx.accountName}
            className="mt-4"
          />
        </section>
      )}
    </>
  );
}

function PaywallBanner({
  headline,
  subtitle,
}: {
  headline: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6 rounded-[11px] border border-accent/30 bg-accent-light/50 p-6">
      <h2 className="text-lg font-semibold text-ink">{headline}</h2>
      <p className="mt-2 text-sm text-text-2">{subtitle}</p>
    </div>
  );
}

function PaywallPrice({ price, period }: { price: string; period: string }) {
  return (
    <div className="mt-2 flex items-baseline gap-0.5">
      <span className="font-serif text-3xl text-ink">{price}</span>
      <span className="text-sm text-ink-3">{period}</span>
    </div>
  );
}
