import { requireAccountAdmin } from '@/lib/api-auth';
import { needsDowngradeSelection } from '@/lib/billing/access';
import { recordBillingEvent } from '@/lib/billing/record-event';
import { syncAccountFromCheckoutSession } from '@/lib/billing/sync-subscription';
import { getStripe } from '@/lib/stripe-billing';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  try {
    const { membership } = await requireAccountAdmin(request);
    const { sessionId } = await request.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'sessionId is required.', 400)
      );
    }

    const result = await syncAccountFromCheckoutSession(
      membership.account_id,
      sessionId
    );

    const downgradeNeeded = await needsDowngradeSelection(
      membership.account_id
    );

    let stripeCustomerId: string | null = null;
    let stripeSubscriptionId: string | null = null;
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });
      stripeCustomerId =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? null;
      const sub = session.subscription;
      stripeSubscriptionId =
        typeof sub === 'string' ? sub : sub?.id ?? null;
    } catch {
      // non-fatal for confirm response
    }

    await recordBillingEvent({
      source: 'checkout_confirm',
      stripeEventId: `confirm:${sessionId}`,
      eventType: 'checkout.session.completed',
      accountId: membership.account_id,
      stripeCustomerId,
      stripeSubscriptionId,
      checkoutSessionId: sessionId,
      status: 'processed',
    });

    return ok(request, {
      planCode: result.planCode,
      subscriptionStatus: result.subscriptionStatus,
      needsDowngradeSelection: downgradeNeeded,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Checkout session')) {
      return withCors(request, jsonError('VALIDATION_ERROR', err.message, 400));
    }
    if (err instanceof Error && err.message.includes('Payment is still processing')) {
      return withCors(
        request,
        jsonError('PAYMENT_PENDING', err.message, 409)
      );
    }
    return handleRouteError(request, err);
  }
}
