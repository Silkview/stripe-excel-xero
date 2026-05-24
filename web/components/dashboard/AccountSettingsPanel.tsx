'use client';

import { useState } from 'react';
import { useDashboard, PageHeader } from './dashboard-ui';
import { formatPlanSummary } from '@/lib/plans/display';
import BillingPortalButton from './BillingPortalButton';
import SubscribeNowButton from './SubscribeNowButton';
import StripeConnectHealth from './StripeConnectHealth';
import RenameAccountModal from './RenameAccountModal';
import Button from '@/components/ui/Button';

export default function AccountSettingsPanel() {
  const ctx = useDashboard();
  const [accountName, setAccountName] = useState(ctx.accountName);
  const [renameOpen, setRenameOpen] = useState(false);
  const planSummary = formatPlanSummary(ctx.planCode, ctx.subscriptionStatus);

  const showSubscribe =
    ctx.isAdmin &&
    (ctx.subscriptionStatus === 'trialing' || ctx.planCode === 'free');

  return (
    <>
      <PageHeader
        title="Account settings"
        subtitle="Account details, billing, and plan limits."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[11px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-[15px] font-semibold text-ink">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-text-3">Account name</dt>
              <dd className="font-medium text-ink">{accountName}</dd>
            </div>
            <div>
              <dt className="text-text-3">Owner email</dt>
              <dd className="font-medium text-ink">{ctx.email}</dd>
            </div>
            <div>
              <dt className="text-text-3">Your role</dt>
              <dd className="font-medium capitalize text-ink">{ctx.role}</dd>
            </div>
          </dl>
          {ctx.isAdmin && (
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => setRenameOpen(true)}
            >
              Rename account
            </Button>
          )}
        </section>

        <section className="rounded-[11px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-[15px] font-semibold text-ink">Plan & billing</h2>
          <p className="mt-2 text-sm text-text-2">
            Current plan:{' '}
            <span className="font-medium text-ink">{planSummary}</span>
          </p>
          {ctx.trialEndsAt && (
            <p className="mt-1 text-xs text-text-3">
              Trial ends{' '}
              {new Date(ctx.trialEndsAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              {ctx.trialDaysRemaining !== null &&
                ` (${ctx.trialDaysRemaining} day${ctx.trialDaysRemaining === 1 ? '' : 's'} left)`}
            </p>
          )}
          <ul className="mt-4 space-y-1 font-mono text-xs text-text-2">
            <li>
              Workspaces: {ctx.limits.workspaceCount} / {ctx.limits.maxWorkspaces}
            </li>
            <li>
              Users: {ctx.limits.userCount} / {ctx.limits.maxUsers}
            </li>
            <li>
              Stripe: {ctx.limits.stripeConnectionCount} /{' '}
              {ctx.limits.maxStripeConnections}
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {showSubscribe && <SubscribeNowButton variant="primary" />}
            <BillingPortalButton />
          </div>
        </section>

        <StripeConnectHealth />

        <section className="rounded-[11px] border border-red/30 bg-red-light/40 p-6 lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-red">Danger zone</h2>
          <p className="mt-2 text-sm text-text-2">
            Account deletion is not available yet. You can delete individual
            workspaces from the Workspaces page.
          </p>
        </section>
      </div>

      <RenameAccountModal
        open={renameOpen}
        currentName={accountName}
        onClose={() => setRenameOpen(false)}
        onRenamed={setAccountName}
      />
    </>
  );
}

