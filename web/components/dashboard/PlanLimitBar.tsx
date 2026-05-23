'use client';

import { useDashboard, Pill } from './dashboard-ui';
import { formatPlanSummary } from '@/lib/plans/display';

export default function PlanLimitBar() {
  const ctx = useDashboard();
  const { limits } = ctx;
  const planSummary = formatPlanSummary(
    ctx.planCode,
    ctx.subscriptionStatus
  );

  const items = [
    {
      label: 'Workspaces',
      used: limits.workspaceCount,
      max: limits.maxWorkspaces,
    },
    {
      label: 'Users',
      used: limits.userCount,
      max: limits.maxUsers,
    },
    {
      label: 'Stripe connections',
      used: limits.stripeConnectionCount,
      max: limits.maxStripeConnections,
    },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-[10px] border border-border bg-surface px-5 py-3.5">
      <Pill variant="firm">{planSummary}</Pill>
      <div className="flex flex-1 flex-wrap gap-6">
        {items.map((item) => (
          <div key={item.label} className="text-[12.5px]">
            <span className="text-text-3">{item.label}</span>
            <span className="ml-2 font-mono font-medium text-ink">
              {item.used}
              <span className="text-text-3"> / {item.max}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
