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
