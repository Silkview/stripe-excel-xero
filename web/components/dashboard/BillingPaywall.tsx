'use client';

import { useDashboard, PageHeader } from './dashboard-ui';
import BillingPortalButton from './BillingPortalButton';
import DeleteAccountButton from './DeleteAccountButton';
import PlanUpgradePicker from '@/components/billing/PlanUpgradePicker';

export default function BillingPaywall() {
  const ctx = useDashboard();

  const headline =
    ctx.billingAccess === 'payment_required'
      ? 'Your subscription is inactive'
      : 'Your trial has ended';

  const subtitle =
    ctx.billingAccess === 'payment_required'
      ? 'Update your payment method or choose a plan to continue using Silkview Connect.'
      : 'Subscribe to Pro or Firm to keep syncing Stripe and Xero data, or delete your account.';

  return (
    <>
      <PageHeader title="Billing" subtitle={subtitle} />

      <div className="mb-6 rounded-[11px] border border-accent/30 bg-accent-light/50 p-6">
        <h2 className="text-lg font-semibold text-ink">{headline}</h2>
        <p className="mt-2 text-sm text-text-2">{subtitle}</p>
      </div>

      {ctx.isAdmin ? (
        <>
          <PlanUpgradePicker className="max-w-3xl" />
          {ctx.hasStripeCustomer && (
            <div className="mt-6">
              <BillingPortalButton />
            </div>
          )}
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
