import type { PlanCode, PlanRow } from './types';

/** Used when core.plans cannot be read via PostgREST (e.g. schema not exposed). */
export const FALLBACK_PLANS: PlanRow[] = [
  {
    code: 'free',
    name: 'Free',
    description: 'Get started with one workspace and core sync features.',
    features: [
      'Excel add-in for Stripe & Xero',
      '1 user',
      '1 workspace',
      '1 Stripe account',
      '1 Xero organisation per workspace',
    ],
    max_users: 1,
    max_workspaces: 1,
    max_stripe_connections: 1,
    max_stripe_connections_per_workspace: 1,
    max_xero_connections_per_workspace: 1,
    stripe_price_id: null,
    sort_order: 0,
  },
  {
    code: 'pro',
    name: 'Pro',
    description: 'For solo operators who need a single workspace.',
    features: [
      'Everything in Free',
      '1 user',
      '1 workspace',
      '1 Stripe account',
      'Priority email support',
    ],
    max_users: 1,
    max_workspaces: 1,
    max_stripe_connections: 1,
    max_stripe_connections_per_workspace: 1,
    max_xero_connections_per_workspace: 1,
    stripe_price_id: null,
    sort_order: 1,
  },
  {
    code: 'firm',
    name: 'Firm',
    description: 'For teams managing multiple clients in one account.',
    features: [
      'Up to 5 users (invite team)',
      'Up to 5 workspaces',
      'Up to 5 Stripe accounts per workspace',
      '1 Xero org per workspace',
    ],
    max_users: 5,
    max_workspaces: 5,
    max_stripe_connections: 25,
    max_stripe_connections_per_workspace: 5,
    max_xero_connections_per_workspace: 1,
    stripe_price_id: null,
    sort_order: 2,
  },
];

export function getFallbackPlanByCode(code: PlanCode): PlanRow | null {
  return FALLBACK_PLANS.find((p) => p.code === code) ?? null;
}
