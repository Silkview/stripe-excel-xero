export type PlanCode = 'free' | 'pro' | 'firm';

export type PlanRow = {
  code: PlanCode;
  name: string;
  description: string;
  features: string[];
  max_users: number;
  max_workspaces: number;
  max_stripe_connections: number;
  max_xero_connections_per_workspace: number;
  stripe_price_id: string | null;
  sort_order: number;
};

export type PlanLimits = {
  planCode: PlanCode;
  maxUsers: number;
  maxWorkspaces: number;
  maxStripeConnections: number;
  maxXeroConnectionsPerWorkspace: number;
};
