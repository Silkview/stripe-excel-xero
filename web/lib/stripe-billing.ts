import Stripe from 'stripe';
import type { BillingInterval } from '@/lib/plans/pricing';
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

export type PaidPlan = 'pro' | 'firm';

const PLAN_PRICE_ENV: Record<
  PaidPlan,
  Record<BillingInterval, string>
> = {
  pro: {
    monthly: 'STRIPE_PRO_PRICE_ID',
    annual: 'STRIPE_PRO_ANNUAL_PRICE_ID',
  },
  firm: {
    monthly: 'STRIPE_FIRM_PRICE_ID',
    annual: 'STRIPE_FIRM_ANNUAL_PRICE_ID',
  },
};

export const PLANS = {
  pro: {
    name: 'Pro',
    monthly: {
      priceId: process.env.STRIPE_PRO_PRICE_ID!,
      amount: 2900,
    },
    annual: {
      priceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
      amount: 29000,
    },
  },
  firm: {
    name: 'Firm',
    monthly: {
      priceId: process.env.STRIPE_FIRM_PRICE_ID!,
      amount: 7900,
    },
    annual: {
      priceId: process.env.STRIPE_FIRM_ANNUAL_PRICE_ID!,
      amount: 79000,
    },
  },
};

export function getPlanPriceId(
  plan: PaidPlan,
  interval: BillingInterval
): string {
  return PLANS[plan][interval].priceId;
}

/** Reverse-lookup: given a Stripe price ID, return its billing interval. */
export function intervalForPriceId(priceId: string): BillingInterval | null {
  if (!priceId) return null;
  for (const plan of ['pro', 'firm'] as const) {
    if (priceId === PLANS[plan].monthly.priceId) return 'monthly';
    if (priceId === PLANS[plan].annual.priceId) return 'annual';
  }
  return null;
}

/** Reverse-lookup: given a Stripe price ID, return its plan code. */
export function planForPriceId(priceId: string): PaidPlan | null {
  if (!priceId) return null;
  for (const plan of ['pro', 'firm'] as const) {
    if (
      priceId === PLANS[plan].monthly.priceId ||
      priceId === PLANS[plan].annual.priceId
    ) {
      return plan;
    }
  }
  return null;
}

function stripeKeyMode(): 'test' | 'live' | 'unknown' {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  if (key.startsWith('sk_test_')) return 'test';
  if (key.startsWith('sk_live_')) return 'live';
  return 'unknown';
}

/** Ensure price exists on the Stripe account tied to STRIPE_SECRET_KEY before checkout. */
async function validatePlanPrice(
  plan: PaidPlan,
  interval: BillingInterval
): Promise<string> {
  const priceId = getPlanPriceId(plan, interval);
  const envName = PLAN_PRICE_ENV[plan][interval];
  if (!priceId?.trim()) {
    throw new Error(
      `${envName} is not configured. Add a price ID from your Stripe Dashboard (same account and mode as STRIPE_SECRET_KEY).`
    );
  }

  try {
    const price = await getStripe().prices.retrieve(priceId);
    if (!price.active) {
      throw new Error(
        `Stripe price ${priceId} for ${plan} (${interval}) is inactive. Reactivate it in Stripe Dashboard or update ${envName}.`
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
    if (
      msg.includes('mode mismatch') ||
      msg.includes('inactive') ||
      msg.includes('not configured')
    ) {
      throw err instanceof Error ? err : new Error(msg);
    }
    throw new Error(
      `Stripe price not found for ${plan} ${interval} (${priceId}). Your STRIPE_SECRET_KEY is ${stripeKeyMode()} mode — prices must be created in the same Stripe account with the same Test/Live toggle. Copy price IDs from Product catalog → Pricing (not Product ID). Set ${envName} on your host. Original: ${msg}`
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

  if (account?.stripe_customer_id) {
    try {
      await getStripe().customers.retrieve(account.stripe_customer_id);
      return account.stripe_customer_id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('No such customer')) {
        throw err;
      }
      await core(supabase)
        .from('accounts')
        .update({
          stripe_customer_id: null,
          stripe_subscription_id: null,
        })
        .eq('id', accountId);
    }
  }

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
  plan: PaidPlan,
  interval: BillingInterval,
  returnUrl: string
) {
  const priceId = await validatePlanPrice(plan, interval);
  const customerId = await getOrCreateCustomer(accountId, userEmail);
  return getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
    metadata: { accountId, plan, interval },
    subscription_data: {
      metadata: { accountId, plan, interval },
    },
    automatic_tax: { enabled: true },
    billing_address_collection: 'required',
    customer_update: { address: 'auto', name: 'auto' },
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/** All configured Stripe price IDs for plan resolution. */
export function allConfiguredPriceIds(): string[] {
  const ids: string[] = [];
  for (const plan of ['pro', 'firm'] as const) {
    for (const interval of ['monthly', 'annual'] as const) {
      const id = getPlanPriceId(plan, interval)?.trim();
      if (id) ids.push(id);
    }
  }
  return ids;
}
