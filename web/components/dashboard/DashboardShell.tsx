'use client';

import { usePathname } from 'next/navigation';
import type { DashboardContext } from '@/lib/dashboard/types';
import { DashboardProvider, ToastProvider } from './dashboard-ui';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopbar from './DashboardTopbar';
import TrialBanner from './TrialBanner';
import FreeUpgradeBanner from './FreeUpgradeBanner';
import DashboardAccessGate from './DashboardAccessGate';

export default function DashboardShell({
  context,
  children,
}: {
  context: DashboardContext;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <DashboardProvider value={context}>
      <ToastProvider>
        <div className="flex h-screen overflow-hidden bg-bg">
          <DashboardSidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <DashboardTopbar pathname={pathname} />
            <FreeUpgradeBanner />
            <TrialBanner />
            <DashboardAccessGate>
              <main className="flex-1 overflow-y-auto p-7">{children}</main>
            </DashboardAccessGate>
          </div>
        </div>
      </ToastProvider>
    </DashboardProvider>
  );
}
