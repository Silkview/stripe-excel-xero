const titles: Record<string, string> = {
  '/dashboard': 'Workspaces',
  '/dashboard/team': 'Team',
  '/dashboard/security': 'Security & MFA',
  '/dashboard/settings': 'Account settings',
};

export default function DashboardTopbar({ pathname }: { pathname: string }) {
  const title = titles[pathname] ?? 'Dashboard';

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-surface px-7">
      <h1 className="text-[15px] font-semibold text-ink">{title}</h1>
    </header>
  );
}
