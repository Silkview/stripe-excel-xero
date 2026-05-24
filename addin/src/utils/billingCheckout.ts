import { apiPost } from './api';

export async function startBillingCheckout(
  plan: 'pro' | 'firm',
  interval: 'monthly' | 'annual' = 'monthly'
): Promise<{ url?: string; error?: string }> {
  const res = await apiPost<{ url: string }>('/api/billing/checkout', {
    plan,
    interval,
  });
  if (res.success && res.data?.url) {
    return { url: res.data.url };
  }
  return { error: res.error?.message ?? 'Could not start checkout.' };
}
