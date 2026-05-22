import Stripe from 'stripe';
import { createSupabaseAdmin } from './supabase/admin';
import { core } from './supabase/core';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.');
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export const PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    amount: 2900,
    name: 'Pro',
  },
  firm: {
    priceId: process.env.STRIPE_FIRM_PRICE_ID!,
    amount: 7900,
    name: 'Firm',
  },
};

export async function getOrCreateCustomer(
  accountId: string,
  email: string
): Promise<string> {
  const supabase = createSupabaseAdmin();
  const { data: account } = await core(supabase)
    .from('accounts')
    .select('stripe_customer_id')
    .eq('id', accountId)
    .single();

  if (account?.stripe_customer_id) return account.stripe_customer_id;

  const customer = await getStripe().customers.create({
    email,
    metadata: { accountId },
  });

  await core(supabase)
    .from('accounts')
    .update({ stripe_customer_id: customer.id })
    .eq('id', accountId);

  return customer.id;
}

export async function createCheckoutSession(
  accountId: string,
  userEmail: string,
  plan: 'pro' | 'firm',
  returnUrl: string
) {
  const customerId = await getOrCreateCustomer(accountId, userEmail);
  return getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
    metadata: { accountId },
    subscription_data: {
      trial_period_days: 14,
      metadata: { accountId },
    },
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
