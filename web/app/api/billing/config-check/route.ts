import { requireAccountAdmin } from '@/lib/api-auth';
import { PLANS, getStripe } from '@/lib/stripe-billing';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

function stripeKeyMode(): 'test' | 'live' | 'unknown' {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  if (key.startsWith('sk_test_')) return 'test';
  if (key.startsWith('sk_live_')) return 'live';
  return 'unknown';
}

async function checkPrice(plan: 'pro' | 'firm') {
  const priceId = PLANS[plan].priceId?.trim() ?? '';
  if (!priceId) {
    return {
      plan,
      configured: false,
      ok: false,
      error: `STRIPE_${plan.toUpperCase()}_PRICE_ID is not set`,
    };
  }

  try {
    const price = await getStripe().prices.retrieve(priceId);
    const keyMode = stripeKeyMode();
    const modeMatch =
      keyMode === 'unknown' || price.livemode === (keyMode === 'live');
    return {
      plan,
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

    const [pro, firm] = await Promise.all([
      checkPrice('pro'),
      checkPrice('firm'),
    ]);

    return ok(request, {
      hasSecretKey,
      keyMode,
      allOk: hasSecretKey && pro.ok && firm.ok,
      pro,
      firm,
      hint:
        keyMode === 'live'
          ? 'Production uses live keys — create prices with Test mode OFF in Stripe Dashboard.'
          : 'Development uses test keys — create prices with Test mode ON in Stripe Dashboard.',
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
