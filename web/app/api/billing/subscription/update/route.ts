import { requireUser, getAccountMembership } from '@/lib/api-auth';
import {
  getPlanPriceId,
  getStripe,
  type PaidPlan,
} from '@/lib/stripe-billing';
import { syncAccountFromStripeSubscription } from '@/lib/billing/sync-subscription';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request);
    const membership = await getAccountMembership(user.id);
    if (!membership) {
      return withCors(request, jsonError('ACCOUNT_REQUIRED', 'No account.', 403));
    }
    if (membership.role === 'member') {
      return withCors(request, jsonError('FORBIDDEN', 'Admins only.', 403));
    }

    const body = await request.json().catch(() => ({}));
    const plan = body?.plan;
    const interval = body?.interval ?? 'monthly';

    if (plan !== 'pro' && plan !== 'firm') {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Plan must be pro or firm.', 400)
      );
    }
    if (interval !== 'monthly' && interval !== 'annual') {
      return withCors(
        request,
        jsonError(
          'VALIDATION_ERROR',
          'Interval must be monthly or annual.',
          400
        )
      );
    }

    const admin = createSupabaseAdmin();
    const { data: account } = await core(admin)
      .from('accounts')
      .select('stripe_subscription_id, plan_code, billing_interval')
      .eq('id', membership.account_id)
      .single();

    if (!account) {
      return withCors(
        request,
        jsonError('ACCOUNT_NOT_FOUND', 'Account not found.', 404)
      );
    }

    if (!account.stripe_subscription_id) {
      return withCors(
        request,
        jsonError(
          'NO_SUBSCRIPTION',
          'No active subscription to update. Start a new subscription instead.',
          400
        )
      );
    }

    if (
      account.plan_code === plan &&
      account.billing_interval === interval
    ) {
      return withCors(
        request,
        jsonError(
          'NO_CHANGE',
          'You are already on this plan and interval.',
          400
        )
      );
    }

    // Firm -> Pro requires the workspace-cleanup wizard, not a direct switch.
    if (account.plan_code === 'firm' && plan === 'pro') {
      return withCors(
        request,
        jsonError(
          'NEEDS_DOWNGRADE_WIZARD',
          'Downgrading from Firm to Pro requires the downgrade wizard. Open /dashboard/billing?step=downgrade to remove extra workspaces first.',
          400
        )
      );
    }

    const newPriceId = getPlanPriceId(plan as PaidPlan, interval);
    if (!newPriceId?.trim()) {
      return withCors(
        request,
        jsonError(
          'BILLING_CONFIG',
          `Stripe price ID not configured for ${plan} ${interval}.`,
          400
        )
      );
    }

    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(
      account.stripe_subscription_id
    );
    const currentItemId = sub.items.data[0]?.id;

    if (!currentItemId) {
      return withCors(
        request,
        jsonError(
          'STRIPE_INVALID_SUBSCRIPTION',
          'Stripe subscription has no line items. Contact support.',
          400
        )
      );
    }

    const updated = await stripe.subscriptions.update(
      account.stripe_subscription_id,
      {
        items: [{ id: currentItemId, price: newPriceId }],
        proration_behavior: 'create_prorations',
        payment_behavior: 'pending_if_incomplete',
        metadata: {
          accountId: membership.account_id,
          plan,
          interval,
        },
      }
    );

    await syncAccountFromStripeSubscription(membership.account_id, updated);

    return ok(request, {
      planCode: plan,
      billingInterval: interval,
      status: updated.status,
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
