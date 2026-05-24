'use client';

import Link from 'next/link';
import { useDashboard } from './dashboard-ui';
import PlanUpgradePicker from '@/components/billing/PlanUpgradePicker';

export default function FreeUpgradeBanner() {
  const ctx = useDashboard();

  if (ctx.planCode !== 'free' || !ctx.isAdmin) {
    return null;
  }

  return (
    <div className="border-b border-accent/30 bg-accent-light px-7 py-5">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-base font-semibold text-ink sm:text-lg">
          Upgrade to unlock Xero
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-text-2">
          Free includes Stripe pulls to Excel. Connect Xero, refresh account
          mappings, and push journals or bank transactions on Pro or Firm.
        </p>
        <div className="mt-4 max-w-2xl">
          <PlanUpgradePicker compact />
        </div>
        <p className="mt-3 text-xs text-text-3">
          Or open{' '}
          <Link href="/dashboard/billing" className="text-accent underline">
            Billing
          </Link>{' '}
          for full plan details.
        </p>
      </div>
    </div>
  );
}
