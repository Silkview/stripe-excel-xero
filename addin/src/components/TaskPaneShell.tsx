import type { ReactNode } from 'react';
import Header from './ui/Header';
import UpgradePlanBanner from './UpgradePlanBanner';
import NotificationDock from './NotificationDock';

type TaskPaneShellProps = {
  children: ReactNode;
  signedIn?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onSignOut?: () => void;
  showUpgradeBanner?: boolean;
  billingUrl?: string;
  showNotificationDock?: boolean;
};

export default function TaskPaneShell({
  children,
  signedIn = false,
  refreshing = false,
  onRefresh,
  onSignOut,
  showUpgradeBanner = false,
  billingUrl,
  showNotificationDock = true,
}: TaskPaneShellProps) {
  return (
    <div className="h-screen bg-bg flex flex-col overflow-hidden font-sans text-ink">
      <Header
        signedIn={signedIn}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onSignOut={onSignOut}
      />
      {showUpgradeBanner && billingUrl && (
        <UpgradePlanBanner billingUrl={billingUrl} sticky />
      )}
      <div className="flex-1 min-h-0 overflow-y-auto pb-2">{children}</div>
      {showNotificationDock && <NotificationDock />}
    </div>
  );
}
