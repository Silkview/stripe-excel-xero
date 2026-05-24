'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useDashboard, PageHeader } from '@/components/dashboard/dashboard-ui';
import BillingPaywall from '@/components/dashboard/BillingPaywall';
import ProDowngradeWizard from '@/components/dashboard/ProDowngradeWizard';
import BillingPortalButton from '@/components/dashboard/BillingPortalButton';
import PlanUpgradePicker from '@/components/billing/PlanUpgradePicker';

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
    return (
      <p className="text-sm text-text-2">Confirming your subscription…</p>
    );
  }

  const isFree = ctx.planCode === 'free';
  const showPlanPicker =
    ctx.isAdmin && (isFree || ctx.needsCheckout) && !ctx.hasPaidSubscription;

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

      <section className="max-w-xl rounded-[11px] border border-border bg-surface p-6 shadow-card">
        <p className="text-sm text-text-2">
          Current plan:{' '}
          <span className="font-medium capitalize text-ink">{ctx.planLabel}</span>
          {ctx.subscriptionStatus && (
            <span className="text-text-3"> ({ctx.subscriptionStatus})</span>
          )}
        </p>

        {ctx.isAdmin ? (
          showPlanPicker ? (
            <div className="mt-4">
              <PlanUpgradePicker
                defaultPlan={ctx.planCode === 'firm' ? 'firm' : 'pro'}
              />
            </div>
          ) : ctx.hasPaidSubscription ? (
            <div className="mt-4">
              <BillingPortalButton />
            </div>
          ) : null
        ) : (
          <p className="mt-4 text-sm text-text-2">
            Contact your account admin to manage billing.
          </p>
        )}
      </section>
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
