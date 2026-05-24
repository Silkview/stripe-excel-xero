'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDashboard, PageHeader } from '@/components/dashboard/dashboard-ui';
import BillingPaywall from '@/components/dashboard/BillingPaywall';
import ProDowngradeWizard from '@/components/dashboard/ProDowngradeWizard';
import BillingPortalButton from '@/components/dashboard/BillingPortalButton';
import SubscribeNowButton from '@/components/dashboard/SubscribeNowButton';
import type { PlanCode } from '@/lib/plans/types';
import { MARKETING_PLANS } from '@/lib/plans/marketing';
import Button from '@/components/ui/Button';

const PAID_PLANS = MARKETING_PLANS.filter(
  (p) => p.code === 'pro' || p.code === 'firm'
);

function BillingPageContent() {
  const ctx = useDashboard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get('step');
  const checkoutSuccess = searchParams.get('checkout') === 'success';
  const sessionId = searchParams.get('session_id');

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>(
    ctx.planCode === 'firm' ? 'firm' : 'pro'
  );
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutSuccess || !sessionId || confirmed || confirming) return;

    let cancelled = false;
    setConfirming(true);
    setConfirmError(null);

    void (async () => {
      try {
        const res = await fetch('/api/billing/checkout/confirm', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) {
          setConfirmError(data.error?.message ?? 'Could not confirm payment.');
          return;
        }
        setConfirmed(true);
        router.refresh();
      } catch {
        if (!cancelled) {
          setConfirmError('Could not confirm payment.');
        }
      } finally {
        if (!cancelled) setConfirming(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [checkoutSuccess, sessionId, confirmed, confirming, router]);

  const startCheckout = async (plan: PlanCode) => {
    setCheckoutLoading(true);
    setCheckoutError(null);
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
      setCheckoutError(data.error?.message ?? 'Could not start checkout.');
    } catch {
      setCheckoutError('Could not start checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (ctx.needsDowngradeSelection || step === 'downgrade') {
    return <ProDowngradeWizard />;
  }

  if (ctx.billingBlocked) {
    return <BillingPaywall />;
  }

  if (confirming) {
    return (
      <p className="text-sm text-text-2">Confirming your subscription…</p>
    );
  }

  return (
    <>
      <PageHeader
        title="Billing"
        subtitle={
          ctx.hasPaidSubscription
            ? 'Manage your subscription and payment history.'
            : 'Choose a plan and subscribe to continue after your trial.'
        }
      />

      {(checkoutSuccess || confirmed) && !confirmError && (
        <div className="mb-6 rounded-[11px] border border-green/30 bg-green-light/50 p-4 text-sm text-ink">
          Payment successful. Your subscription is now active.{' '}
          <Link
            href="/dashboard"
            className="font-medium text-accent hover:underline"
          >
            Go to dashboard
          </Link>
        </div>
      )}

      {confirmError && (
        <div className="mb-6 rounded-[11px] border border-warn/30 bg-warn-bg p-4 text-sm text-ink">
          {confirmError} If you completed payment, refresh the page or contact
          support.
        </div>
      )}

      <section className="max-w-xl rounded-[11px] border border-border bg-surface p-6 shadow-card">
        <p className="text-sm text-text-2">
          Current plan:{' '}
          <span className="font-medium capitalize text-ink">{ctx.planLabel}</span>
          {ctx.subscriptionStatus && (
            <span className="text-text-3"> ({ctx.subscriptionStatus})</span>
          )}
        </p>

        {ctx.isAdmin ? (
          ctx.hasPaidSubscription ? (
            <div className="mt-4">
              <BillingPortalButton />
            </div>
          ) : ctx.needsCheckout ? (
            <CheckoutPlanPicker
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              loading={checkoutLoading}
              error={checkoutError}
              onCheckout={() => void startCheckout(selectedPlan)}
            />
          ) : (
            <div className="mt-4">
              <SubscribeNowButton variant="primary" />
            </div>
          )
        ) : (
          <p className="mt-4 text-sm text-text-2">
            Contact your account admin to manage billing.
          </p>
        )}
      </section>
    </>
  );
}

function CheckoutPlanPicker({
  selectedPlan,
  onSelectPlan,
  loading,
  error,
  onCheckout,
}: {
  selectedPlan: PlanCode;
  onSelectPlan: (plan: PlanCode) => void;
  loading: boolean;
  error: string | null;
  onCheckout: () => void;
}) {
  return (
    <div className="mt-4">
      <p className="mb-3 text-sm text-text-2">
        Select a plan to open Stripe Checkout:
      </p>
      <PlanSelectGrid
        selectedPlan={selectedPlan}
        onSelectPlan={onSelectPlan}
      />
      <Button
        variant="primary"
        className="mt-4 !bg-accent hover:!bg-accent-hover"
        disabled={loading}
        onClick={onCheckout}
      >
        {loading ? 'Opening checkout…' : `Subscribe to ${selectedPlan}`}
      </Button>
      {error && <p className="mt-2 text-sm text-warn">{error}</p>}
    </div>
  );
}

function PlanSelectGrid({
  selectedPlan,
  onSelectPlan,
}: {
  selectedPlan: PlanCode;
  onSelectPlan: (plan: PlanCode) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PAID_PLANS.map((p) => (
        <button
          key={p.code}
          type="button"
          onClick={() => onSelectPlan(p.code)}
          className={`rounded-lg border p-4 text-left text-sm transition-all ${
            selectedPlan === p.code
              ? 'border-accent bg-[#EEF4FF] ring-2 ring-accent/30'
              : 'border-rule hover:border-accent/40'
          }`}
        >
          <span className="font-semibold text-ink">{p.name}</span>
          <span className="mt-1 block text-xs text-text-3">{p.tagline}</span>
        </button>
      ))}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-2">Loading…</p>}>
      <BillingPageContent />
    </Suspense>
  );
}
