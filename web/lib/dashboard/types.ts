import type { PlanCode } from '@/lib/plans/types';

export type DashboardRole = 'owner' | 'admin' | 'member';

export type DashboardLimits = {
  maxWorkspaces: number;
  maxUsers: number;
  maxStripeConnections: number;
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
  limits: DashboardLimits;
  workspaceCount: number;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  created_at: string;
  xero: {
    connected: boolean;
    tenant_name: string | null;
    token_expiring?: boolean;
  } | null;
  stripe: Array<{
    id: string;
    stripe_account_id: string;
    display_name: string | null;
    livemode?: boolean;
  }>;
};
