import { MARKETING_PLANS } from './marketing';
import type { PlanCode } from './types';

export function planDisplayName(planCode: string): string {
  const match = MARKETING_PLANS.find((p) => p.code === planCode);
  return match?.name ?? planCode;
}

export function planStatusLabel(
  planCode: PlanCode,
  subscriptionStatus: string | null
): string | null {
  if (planCode === 'free') {
    return null;
  }
  if (subscriptionStatus === 'trialing') {
    return 'trialing';
  }
  if (subscriptionStatus === 'active') {
    return 'active';
  }
  if (subscriptionStatus === 'past_due') {
    return 'past due';
  }
  if (subscriptionStatus === 'canceled') {
    return 'canceled';
  }
  return subscriptionStatus;
}

export function formatPlanSummary(
  planCode: string,
  subscriptionStatus: string | null
): string {
  const name = planDisplayName(planCode);
  const status = planStatusLabel(planCode as PlanCode, subscriptionStatus);
  if (status) {
    return `${name} (${status})`;
  }
  return name;
}
