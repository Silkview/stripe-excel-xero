import type { PlanCode } from './types';
import type { BillingInterval } from './pricing';
import { planPriceDisplay } from './pricing';

export type MarketingPlanFeature = {
  text: string;
  dimmed?: boolean;
  bold?: boolean;
};

export type MarketingPlan = {
  code: PlanCode;
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: MarketingPlanFeature[];
  featured: boolean;
  featuredLabel?: string;
  cta: string;
  note: string;
};

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    code: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    tagline: '1 user · 1 workspace · 1 Stripe account',
    features: [
      { text: 'Pull Stripe data to Excel' },
      { text: 'Up to 100 transactions per pull', bold: true },
      { text: 'Account_Mappings sheet (setup only)' },
      { text: 'Xero connect, refresh & push — Pro and Firm only', bold: true },
      { text: 'Full transaction history (2,000 rows)', dimmed: true },
    ],
    featured: false,
    cta: 'Get started free',
    note: 'No credit card. Forever free.',
  },
  {
    code: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/mo',
    tagline: '1 user · 1 workspace · 1 Stripe · 1 Xero org',
    features: [
      { text: 'Everything in Free' },
      { text: 'Up to 2,000 transactions per pull', bold: true },
      { text: 'Push manual journals to Xero' },
      { text: 'Push bank transactions to Xero' },
      { text: 'Row-level status writeback' },
      { text: 'Priority support' },
    ],
    featured: false,
    cta: 'Start 14-day trial',
    note: 'No card during trial period.',
  },
  {
    code: 'firm',
    name: 'Firm',
    price: '$79',
    period: '/mo',
    tagline: '5 users · 5 workspaces · 5 Stripe · 1 Xero per workspace',
    features: [
      { text: 'Everything in Pro' },
      { text: 'Up to 2,000 transactions per pull per workspace', bold: true },
      { text: 'Up to 5 client workspaces' },
      { text: 'Up to 5 Stripe accounts' },
      { text: 'Team invites' },
      { text: 'Priority onboarding call' },
    ],
    featured: true,
    featuredLabel: 'Best for firms',
    cta: 'Start 14-day trial',
    note: 'One subscription. All your Stripe clients.',
  },
];

export function marketingPlansForInterval(
  interval: BillingInterval
): MarketingPlan[] {
  return MARKETING_PLANS.map((plan) => {
    if (plan.code === 'free') return plan;
    const { price, period } = planPriceDisplay(plan.code, interval);
    return { ...plan, price, period };
  });
}
