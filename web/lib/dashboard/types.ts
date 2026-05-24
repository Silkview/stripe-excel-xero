import type { PlanCode } from '@/lib/plans/types';
import type { BillingAccess } from '@/lib/billing/access';
import type { ManualJournalPostMode } from '@stripesync/shared';

export type DashboardRole = 'owner' | 'admin' | 'member';

export type DashboardLimits = {
  maxWorkspaces: number;
  maxUsers: number;
  maxStripeConnections: number;
  maxStripeConnectionsPerWorkspace: number;
  workspaceCount: number;
  userCount: number;
  stripeConnectionCount: number;
};

export type DashboardContext = {
  email: string;
  displayName: string;
  initials: string;
  role: DashboardRole;
  isAdmin: boolean;
  accountId: string;
  accountName: string;
  planCode: PlanCode;
  planLabel: string;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  limits: DashboardLimits;
  workspaceCount: number;
  billingAccess: BillingAccess;
  needsDowngradeSelection: boolean;
  hasStripeCustomer: boolean;
  stripeSubscriptionId: string | null;
  hasPaidSubscription: boolean;
  needsCheckout: boolean;
  billingBlocked: boolean;
  productBlocked: boolean;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  created_at: string;
  manualJournalPostMode: ManualJournalPostMode;
  xero: {
    connected: boolean;
    status: 'connected' | 'reconnect_required' | 'disconnected';
    tenant_name: string | null;
    stale_refresh?: boolean;
  } | null;
  stripe: Array<{
    id: string;
    stripe_account_id: string;
    display_name: string | null;
    livemode?: boolean;
  }>;
};
