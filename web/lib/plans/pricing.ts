import type { PlanCode } from './types';

export type BillingInterval = 'monthly' | 'annual';

export const BILLING_INTERVALS: BillingInterval[] = ['monthly', 'annual'];

export const PLAN_PRICING: Record<
  'pro' | 'firm',
  Record<BillingInterval, { price: string; period: string; amountCents: number }>
> = {
  pro: {
    monthly: { price: '$29', period: '/mo', amountCents: 2900 },
    annual: { price: '$290', period: '/yr', amountCents: 29000 },
  },
  firm: {
    monthly: { price: '$79', period: '/mo', amountCents: 7900 },
    annual: { price: '$790', period: '/yr', amountCents: 79000 },
  },
};

export function isPaidPlan(code: PlanCode): code is 'pro' | 'firm' {
  return code === 'pro' || code === 'firm';
}

export function planPriceDisplay(
  code: PlanCode,
  interval: BillingInterval
): { price: string; period: string } {
  if (!isPaidPlan(code)) {
    return { price: '$0', period: '' };
  }
  const tier = PLAN_PRICING[code][interval];
  return { price: tier.price, period: tier.period };
}

export function billingIntervalLabel(interval: BillingInterval): string {
  return interval === 'monthly' ? 'Monthly' : 'Annual';
}
