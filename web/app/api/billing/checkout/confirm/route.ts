import { requireAccountAdmin } from '@/lib/api-auth';
import { needsDowngradeSelection } from '@/lib/billing/access';
import { syncAccountFromCheckoutSession } from '@/lib/billing/sync-subscription';
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

    return ok(request, {
      planCode: result.planCode,
      subscriptionStatus: result.subscriptionStatus,
      needsDowngradeSelection: downgradeNeeded,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Checkout session')) {
      return withCors(request, jsonError('VALIDATION_ERROR', err.message, 400));
    }
    return handleRouteError(request, err);
  }
}
