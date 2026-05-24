'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDashboard } from './dashboard-ui';

const ALLOWED_WHEN_BILLING_BLOCKED = [
  '/dashboard/billing',
  '/dashboard/settings',
];

export default function DashboardAccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = useDashboard();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ctx.needsDowngradeSelection && pathname !== '/dashboard/billing') {
      router.replace('/dashboard/billing?step=downgrade');
      return;
    }

    if (
      ctx.billingBlocked &&
      !ALLOWED_WHEN_BILLING_BLOCKED.includes(pathname)
    ) {
      router.replace('/dashboard/billing');
    }
  }, [ctx.billingBlocked, ctx.needsDowngradeSelection, pathname, router]);

  return <>{children}</>;
}
