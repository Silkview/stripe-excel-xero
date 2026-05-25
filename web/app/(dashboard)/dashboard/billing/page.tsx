'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDashboard, PageHeader } from '@/components/dashboard/dashboard-ui';
import BillingPaywall from '@/components/dashboard/BillingPaywall';
import ProDowngradeWizard from '@/components/dashboard/ProDowngradeWizard';
import BillingPortalButton from '@/components/dashboard/BillingPortalButton';
import PlanComparisonGrid from '@/components/billing/PlanComparisonGrid';
import {
  startBillingCheckout,
  updateSubscriptionPlan,
  cancelSubscription,
} from '@/lib/billing/checkout-client';
import {
  type BillingInterval,
  billingIntervalLabel,
} from '@/lib/plans/pricing';
import type { PlanCode } from '@/lib/plans/types';

function BillingPageContent() {
  const ctx = useDashboard();
  const { refreshBillingContext } = ctx;
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get('step');
  const checkoutSuccess = searchParams.get('checkout') === 'success';
  const sessionId = searchParams.get('session_id');

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [pendingPlan, setPendingPlan] = useState<PlanCode | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutSuccess || !sessionId || confirmed) return;

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
        await refreshBillingContext();
        router.refresh();
        if (data.data?.needsDowngradeSelection) {
          router.replace('/dashboard/billing?step=downgrade');
          return;
        }
        router.replace('/dashboard/billing');
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
  }, [checkoutSuccess, sessionId, confirmed, router, refreshBillingContext]);

  if (ctx.needsDowngradeSelection || step === 'downgrade') {
    return <ProDowngradeWizard />;
  }

  if (ctx.billingBlocked) {
    return <BillingPaywall />;
  }

  if (confirming) {
    return <p className="text-sm text-text-2">Confirming your subscription…</p>;
  }

  const isFree = ctx.planCode === 'free';

  const handleSwitch = async (
    plan: 'pro' | 'firm',
    interval: BillingInterval
  ) => {
    setActionError(null);
    setActionSuccess(null);

    if (ctx.hasPaidSubscription) {
      const ok = window.confirm(
        `Switch to ${plan === 'pro' ? 'Pro' : 'Firm'} (${billingIntervalLabel(
          interval
        ).toLowerCase()})? Stripe will prorate the difference automatically.`
      );
      if (!ok) return;

      setPendingPlan(plan);
      try {
        const result = await updateSubscriptionPlan(plan, interval);
        if (!result.ok) {
          if (result.code === 'NEEDS_DOWNGRADE_WIZARD') {
            setActionError(result.error);
            router.replace('/dashboard/billing?step=downgrade');
            return;
          }
          setActionError(result.error);
          return;
        }
        await refreshBillingContext();
        router.refresh();
        setActionSuccess(
          `You're now on ${plan === 'pro' ? 'Pro' : 'Firm'} (${billingIntervalLabel(
            interval
          ).toLowerCase()}).`
        );
      } finally {
        setPendingPlan(null);
      }
      return;
    }

    setPendingPlan(plan);
    try {
      const result = await startBillingCheckout(plan, interval);
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setActionError(result.error ?? 'Could not start checkout.');
    } finally {
      setPendingPlan(null);
    }
  };

  const handleDowngradeToFree = async () => {
    setActionError(null);
    setActionSuccess(null);
    const ok = window.confirm(
      "Cancel your paid plan and revert to Free? You'll lose Xero push and higher transaction limits immediately."
    );
    if (!ok) return;

    setPendingPlan('free');
    try {
      const result = await cancelSubscription();
      if (!result.ok) {
        setActionError(result.error ?? 'Could not cancel subscription.');
        return;
      }
      await refreshBillingContext();
      router.refresh();
      setActionSuccess('Your plan has been switched to Free.');
    } finally {
      setPendingPlan(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Billing"
        subtitle={
          isFree
            ? 'Upgrade to Pro or Firm to connect Xero and push to your ledger.'
            : ctx.hasPaidSubscription
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

      {actionSuccess && (
        <div className="mb-6 rounded-[11px] border border-green/30 bg-green-light/50 p-4 text-sm text-ink">
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="mb-6 rounded-[11px] border border-warn/30 bg-warn-bg p-4 text-sm text-ink">
          {actionError}
        </div>
      )}

      <section className="mb-6 max-w-xl rounded-[11px] border border-border bg-surface p-5 shadow-card">
        <p className="text-sm text-text-2">
          Current plan:{' '}
          <span className="font-medium capitalize text-ink">
            {ctx.planLabel}
          </span>
          {ctx.subscriptionStatus && (
            <span className="text-text-3"> ({ctx.subscriptionStatus})</span>
          )}
          {ctx.billingInterval && (
            <span className="text-text-3">
              {' · '}
              {billingIntervalLabel(ctx.billingInterval)}
            </span>
          )}
        </p>
      </section>

      {ctx.isAdmin ? (
        <PlanComparisonGrid
          currentPlan={ctx.planCode}
          currentInterval={ctx.billingInterval}
          isAdmin={ctx.isAdmin}
          pendingPlan={pendingPlan}
          onSwitch={handleSwitch}
          onDowngradeToFree={handleDowngradeToFree}
        />
      ) : (
        <p className="text-sm text-text-2">
          Contact your account admin to manage billing.
        </p>
      )}

      {ctx.isAdmin && ctx.hasPaidSubscription && (
        <section className="mt-10 flex flex-wrap items-center gap-3 border-t border-rule pt-6 text-xs text-text-3">
          <span>Need to update your card, change billing address, or download invoices?</span>
          <BillingPortalButton />
        </section>
      )}
    </>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-2">Loading…</p>}>
      <BillingPageContent />
    </Suspense>
  );
}
