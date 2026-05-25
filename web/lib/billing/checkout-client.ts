import type { BillingInterval } from '@/lib/plans/pricing';

export async function startBillingCheckout(
  plan: 'pro' | 'firm',
  interval: BillingInterval
): Promise<{ url?: string; error?: string }> {
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, interval }),
  });
  const data = await res.json();
  if (data.success && data.data?.url) {
    return { url: data.data.url as string };
  }
  return { error: data.error?.message ?? 'Could not start checkout.' };
}

export type UpdateSubscriptionResult =
  | {
      ok: true;
      planCode: 'pro' | 'firm';
      billingInterval: BillingInterval;
      status: string;
    }
  | { ok: false; error: string; code?: string };

export async function updateSubscriptionPlan(
  plan: 'pro' | 'firm',
  interval: BillingInterval
): Promise<UpdateSubscriptionResult> {
  const res = await fetch('/api/billing/subscription/update', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, interval }),
  });
  const data = await res.json().catch(() => null);
  if (data?.success && data.data) {
    return {
      ok: true,
      planCode: data.data.planCode,
      billingInterval: data.data.billingInterval,
      status: data.data.status,
    };
  }
  return {
    ok: false,
    error: data?.error?.message ?? 'Could not switch plan.',
    code: data?.error?.code,
  };
}

export async function cancelSubscription(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const res = await fetch('/api/billing/cancel', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(() => null);
  if (data?.success) return { ok: true };
  return {
    ok: false,
    error: data?.error?.message ?? 'Could not cancel subscription.',
  };
}
