'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDashboard } from './dashboard-ui';
import SubscribeNowButton from './SubscribeNowButton';

export default function TrialBanner() {
  const ctx = useDashboard();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('trial_banner_dismissed') === '1') {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const trialActive =
    ctx.subscriptionStatus === 'trialing' &&
    ctx.trialEndsAt &&
    new Date(ctx.trialEndsAt).getTime() > Date.now() &&
    ctx.trialDaysRemaining !== null;

  const trialExpiredInApp =
    ctx.subscriptionStatus === 'trialing' &&
    ctx.trialEndsAt &&
    new Date(ctx.trialEndsAt).getTime() <= Date.now();

  if (dismissed || ctx.billingBlocked) return null;

  if (ctx.hasPaidSubscription || ctx.subscriptionStatus === 'active') {
    return null;
  }

  if (trialExpiredInApp || (trialActive && ctx.trialDaysRemaining === 0)) {
    return (
      <UrgentTrialBanner />
    );
  }

  if (!trialActive) return null;

  const days = ctx.trialDaysRemaining ?? 0;
  const dayLabel = days === 1 ? '1 day' : `${days} days`;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('trial_banner_dismissed', '1');
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-accent/20 bg-accent-light px-7 py-3">
      <p className="text-sm text-ink">
        <span className="font-semibold">{dayLabel} left</span>
        <span className="text-text-2"> on your trial.</span>
      </p>
      <div className="flex items-center gap-2">
        <SubscribeNowButton variant="primary" className="!py-1.5 !px-3 !text-xs" />
        <button
          type="button"
          onClick={dismiss}
          className="text-xs text-text-3 hover:text-ink"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function UrgentTrialBanner() {
  const ctx = useDashboard();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warn/30 bg-warn-bg px-7 py-3">
      <p className="text-sm font-medium text-ink">
        Your trial has ended. Subscribe to keep using Silkview Connect.
      </p>
      {ctx.isAdmin && (
        <Link
          href="/dashboard/billing"
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
        >
          Choose a plan
        </Link>
      )}
    </div>
  );
}
