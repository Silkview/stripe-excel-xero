'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDashboard, PageHeader } from '@/components/dashboard/dashboard-ui';
import BillingPaywall from '@/components/dashboard/BillingPaywall';
import ProDowngradeWizard from '@/components/dashboard/ProDowngradeWizard';
import BillingPortalButton from '@/components/dashboard/BillingPortalButton';
import SubscribeNowButton from '@/components/dashboard/SubscribeNowButton';

function BillingPageContent() {
  const ctx = useDashboard();
  const searchParams = useSearchParams();
  const step = searchParams.get('step');
  const checkoutSuccess = searchParams.get('checkout') === 'success';

  if (ctx.needsDowngradeSelection || step === 'downgrade') {
    return <ProDowngradeWizard />;
  }

  if (ctx.billingBlocked) {
    return <BillingPaywall />;
  }

  return (
    <>
      <PageHeader
        title="Billing"
        subtitle="Manage your subscription and payment history."
      />
      {checkoutSuccess && (
        <div className="mb-6 rounded-[11px] border border-green/30 bg-green-light/50 p-4 text-sm text-ink">
          Payment successful. Your subscription is now active.{' '}
          <Link href="/dashboard" className="font-medium text-accent hover:underline">
            Go to dashboard
          </Link>
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
        <ActiveBillingActions
          isAdmin={ctx.isAdmin}
          hasStripeCustomer={ctx.hasStripeCustomer}
        />
      </section>
    </>
  );
}

function ActiveBillingActions({
  isAdmin,
  hasStripeCustomer,
}: {
  isAdmin: boolean;
  hasStripeCustomer: boolean;
}) {
  if (!isAdmin) {
    return (
      <p className="mt-4 text-sm text-text-2">
        Contact your account admin to manage billing.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {hasStripeCustomer ? (
        <BillingPortalButton />
      ) : (
        <SubscribeNowButton variant="primary" />
      )}
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
