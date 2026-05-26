'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { betaFeedbackMailtoUrl } from '@/lib/support';
import { useDashboard } from './dashboard-ui';

const navItems = [
  { href: '/dashboard', label: 'Workspaces', adminOnly: false },
  { href: '/dashboard/team', label: 'Team', adminOnly: true },
  { href: '/dashboard/security', label: 'Security & MFA', adminOnly: false },
  { href: '/dashboard/billing', label: 'Billing', adminOnly: true },
  { href: '/dashboard/settings', label: 'Account settings', adminOnly: true },
] as const;

function NavIcon({ name }: { name: string }) {
  if (name === 'Workspaces') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 opacity-80">
        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    );
  }
  if (name === 'Team') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 opacity-80">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    );
  }
  if (name === 'Security & MFA') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 opacity-80">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
    );
  }
  if (name === 'Billing') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 opacity-80">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 opacity-80">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const ctx = useDashboard();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const visibleNav = navItems.filter((item) => {
    if (item.adminOnly && !ctx.isAdmin) return false;
    if (ctx.billingBlocked || ctx.needsDowngradeSelection) {
      return (
        item.href === '/dashboard/billing' || item.href === '/dashboard/settings'
      );
    }
    return true;
  });

  return (
    <aside className="flex h-screen w-[232px] shrink-0 flex-col overflow-y-auto bg-navy text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-[18px] py-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent">
          <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
            <path d="M2 4h10M2 7h10M2 10h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="11" cy="10" r="2.5" fill="#13B5EA" />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight">
          Silkview <span className="font-normal text-white/50">Connect</span>
        </span>
      </div>

      <div className="px-2.5 pt-4">
        <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-widest text-white/30">
          Overview
        </div>
        {visibleNav.slice(0, 2).map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-0.5 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors ${
                active
                  ? 'bg-white/10 font-medium text-white'
                  : 'text-white/65 hover:bg-white/[0.07] hover:text-white'
              }`}
            >
              <NavIcon name={item.label} />
              {item.label}
              {item.label === 'Workspaces' && (
                <span className="ml-auto rounded-full bg-accent px-1.5 py-px font-mono text-[10px] font-semibold">
                  {ctx.workspaceCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="px-2.5 pt-3">
        <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-widest text-white/30">
          Account
        </div>
        {visibleNav.slice(2).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-0.5 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors ${
                active
                  ? 'bg-white/10 font-medium text-white'
                  : 'text-white/65 hover:bg-white/[0.07] hover:text-white'
              }`}
            >
              <NavIcon name={item.label} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="m-2.5 rounded-lg border border-white/10 bg-white/[0.06] p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold">
            {ctx.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{ctx.displayName}</div>
            <div className="truncate text-[11px] text-white/40">{ctx.email}</div>
          </div>
          <span className="shrink-0 rounded-full bg-accent/40 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase text-white/80">
            {ctx.planCode}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-[11px] text-white/50 hover:text-white"
          >
            Sign out
          </button>
          <a
            href={betaFeedbackMailtoUrl()}
            className="text-[11px] text-white/50 hover:text-white"
            title="Send beta feedback"
          >
            Beta feedback →
          </a>
        </div>
      </div>
    </aside>
  );
}
