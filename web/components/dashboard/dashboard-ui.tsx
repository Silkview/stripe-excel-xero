'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { DashboardContext } from '@/lib/dashboard/types';
import type { BillingStatusPayload } from '@/lib/billing/load-billing-status';

type DashboardContextValue = DashboardContext & {
  refreshBillingContext: () => Promise<void>;
};

const DashboardCtx = createContext<DashboardContextValue | null>(null);

function mergeBillingStatus(
  prev: DashboardContext,
  billing: BillingStatusPayload
): DashboardContext {
  return {
    ...prev,
    planCode: billing.planCode,
    planLabel: billing.planLabel,
    subscriptionStatus: billing.subscriptionStatus,
    trialEndsAt: billing.trialEndsAt,
    trialDaysRemaining: billing.trialDaysRemaining,
    hasPaidSubscription: billing.hasPaidSubscription,
    needsCheckout: billing.needsCheckout,
    billingBlocked: billing.billingBlocked,
    needsDowngradeSelection: billing.needsDowngradeSelection,
    hasStripeCustomer: billing.hasStripeCustomer,
    stripeSubscriptionId: billing.stripeSubscriptionId,
    billingInterval: billing.billingInterval,
    billingAccess: billing.billingAccess,
    productBlocked: billing.productBlocked,
    workspaceCount: billing.limits.workspaceCount,
    limits: {
      ...prev.limits,
      maxWorkspaces: billing.limits.maxWorkspaces,
      maxUsers: billing.limits.maxUsers,
      maxStripeConnections: billing.limits.maxStripeConnections,
      workspaceCount: billing.limits.workspaceCount,
      userCount: billing.limits.userCount,
      stripeConnectionCount: billing.limits.stripeConnectionCount,
    },
  };
}

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContext;
  children: ReactNode;
}) {
  const [ctx, setCtx] = useState(value);

  useEffect(() => {
    setCtx(value);
  }, [value]);

  const refreshBillingContext = useCallback(async () => {
    const res = await fetch('/api/billing/status', { credentials: 'include' });
    const data = await res.json();
    if (data.success && data.data) {
      setCtx((prev) => mergeBillingStatus(prev, data.data));
    }
  }, []);

  return (
    <DashboardCtx.Provider value={{ ...ctx, refreshBillingContext }}>
      {children}
    </DashboardCtx.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

type ToastItem = { id: number; message: string };

const ToastCtx = createContext<{
  toast: (message: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string) => {
    const id = Date.now();
    setItems((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[500] flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2 rounded-[9px] bg-navy px-4 py-2.5 text-[13px] text-white shadow-lg"
          >
            <span>✓</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { toast: () => {} };
  return ctx;
}

export function Pill({
  children,
  variant = 'default',
  className = '',
}: {
  children: ReactNode;
  variant?:
    | 'default'
    | 'owner'
    | 'admin'
    | 'member'
    | 'active'
    | 'pending'
    | 'firm';
  className?: string;
}) {
  const styles: Record<string, string> = {
    default: 'bg-bg text-text-2',
    owner: 'bg-[#EDE9FE] text-[#5B21B6]',
    admin: 'bg-accent-light text-accent',
    member: 'bg-teal/10 text-teal',
    active: 'bg-green-light text-green',
    pending: 'bg-amber-light text-amber',
    firm: 'bg-navy text-white',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-[19px] font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[13px] text-text-3">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function DashboardModal({
  open,
  title,
  onClose,
  children,
  footer,
  danger,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-[3px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[440px] overflow-hidden rounded-[14px] bg-surface shadow-xl">
        <div
          className={`flex items-center justify-between border-b border-border px-6 py-4 ${danger ? 'bg-red-light' : ''}`}
        >
          <h2
            className={`text-[15.5px] font-semibold ${danger ? 'text-red' : 'text-ink'}`}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-bg text-text-3 hover:bg-border hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3.5 px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
