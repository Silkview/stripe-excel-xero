import { requireAccountAdmin } from '@/lib/api-auth';
import { PLANS, getStripe } from '@/lib/stripe-billing';
import type { BillingInterval } from '@/lib/plans/pricing';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

function stripeKeyMode(): 'test' | 'live' | 'unknown' {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  if (key.startsWith('sk_test_')) return 'test';
  if (key.startsWith('sk_live_')) return 'live';
  return 'unknown';
}

async function checkPrice(plan: 'pro' | 'firm', interval: BillingInterval) {
  const priceId = PLANS[plan][interval].priceId?.trim() ?? '';
  const envSuffix =
    interval === 'annual' ? '_ANNUAL_PRICE_ID' : '_PRICE_ID';
  const envName = `STRIPE_${plan.toUpperCase()}${envSuffix}`;
  if (!priceId) {
    return {
      plan,
      interval,
      configured: false,
      ok: false,
      error: `${envName} is not set`,
    };
  }

  try {
    const price = await getStripe().prices.retrieve(priceId);
    const keyMode = stripeKeyMode();
    const modeMatch =
      keyMode === 'unknown' || price.livemode === (keyMode === 'live');
    return {
      plan,
      interval,
      configured: true,
      ok: price.active && modeMatch,
      priceIdSuffix: priceId.slice(-8),
      active: price.active,
      livemode: price.livemode,
      keyMode,
      modeMatch,
      error: !price.active
        ? 'Price is inactive in Stripe'
        : !modeMatch
          ? `Mode mismatch: STRIPE_SECRET_KEY is ${keyMode} but price is ${price.livemode ? 'live' : 'test'}`
          : null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      plan,
      interval,
      configured: true,
      ok: false,
      priceIdSuffix: priceId.slice(-8),
      keyMode: stripeKeyMode(),
      error: msg.includes('No such price')
        ? `Price not found with this STRIPE_SECRET_KEY (wrong account or test/live mismatch)`
        : msg.slice(0, 200),
    };
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

/** Admin-only: verify Stripe billing env without exposing secrets. */
export async function GET(request: Request) {
  try {
    await requireAccountAdmin(request);
    const keyMode = stripeKeyMode();
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY?.trim();

    const [proMonthly, proAnnual, firmMonthly, firmAnnual] = await Promise.all([
      checkPrice('pro', 'monthly'),
      checkPrice('pro', 'annual'),
      checkPrice('firm', 'monthly'),
      checkPrice('firm', 'annual'),
    ]);

    const allOk =
      hasSecretKey &&
      proMonthly.ok &&
      proAnnual.ok &&
      firmMonthly.ok &&
      firmAnnual.ok;

    return ok(request, {
      hasSecretKey,
      keyMode,
      allOk,
      pro: { monthly: proMonthly, annual: proAnnual },
      firm: { monthly: firmMonthly, annual: firmAnnual },
      hint:
        keyMode === 'live'
          ? 'Production uses live keys — create prices with Test mode OFF in Stripe Dashboard.'
          : 'Development uses test keys — create prices with Test mode ON in Stripe Dashboard.',
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
