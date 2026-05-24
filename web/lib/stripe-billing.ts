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

function stripeKeyMode(): 'test' | 'live' | 'unknown' {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  if (key.startsWith('sk_test_')) return 'test';
  if (key.startsWith('sk_live_')) return 'live';
  return 'unknown';
}

/** Ensure price exists on the Stripe account tied to STRIPE_SECRET_KEY before checkout. */
async function validatePlanPrice(plan: 'pro' | 'firm'): Promise<string> {
  const priceId = PLANS[plan].priceId;
  if (!priceId?.trim()) {
    throw new Error(
      `STRIPE_${plan.toUpperCase()}_PRICE_ID is not configured. Add a price ID from your Stripe Dashboard (same account and mode as STRIPE_SECRET_KEY).`
    );
  }

  try {
    const price = await getStripe().prices.retrieve(priceId);
    if (!price.active) {
      throw new Error(
        `Stripe price ${priceId} for ${plan} is inactive. Reactivate it in Stripe Dashboard or update STRIPE_${plan.toUpperCase()}_PRICE_ID.`
      );
    }
    const mode = stripeKeyMode();
    if (mode !== 'unknown' && price.livemode !== (mode === 'live')) {
      throw new Error(
        `Stripe mode mismatch: STRIPE_SECRET_KEY is ${mode} but price ${priceId} is ${price.livemode ? 'live' : 'test'}. Use test prices with sk_test_ keys and live prices with sk_live_ keys.`
      );
    }
    return priceId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('mode mismatch') || msg.includes('inactive') || msg.includes('not configured')) {
      throw err instanceof Error ? err : new Error(msg);
    }
    throw new Error(
      `Stripe price not found for ${plan} (${priceId}). Create a subscription price in the same Stripe account and mode as STRIPE_SECRET_KEY, then set STRIPE_${plan.toUpperCase()}_PRICE_ID. Original: ${msg}`
    );
  }
}

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
  const priceId = await validatePlanPrice(plan);
  const customerId = await getOrCreateCustomer(accountId, userEmail);
  return getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
    metadata: { accountId },
    subscription_data: {
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
