import { requireWorkspace, getAccountMembership } from '@/lib/api-auth';
import { enforceStripeConnect } from '@/lib/plan-limits';
import { getStripePlatformAccount } from '@/lib/stripe-connect-config';
import { connectPlatformStripeAccount } from '@/lib/stripe-platform-connect';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

function platformSelfConnectAllowed(): boolean {
  return process.env.STRIPE_ALLOW_PLATFORM_SELF_CONNECT === 'true';
}

/** Dev-only: link workspace to platform STRIPE_SECRET_KEY account. Use OAuth in production. */
export async function POST(request: Request) {
  try {
    if (!platformSelfConnectAllowed()) {
      return withCors(
        request,
        jsonError(
          'FORBIDDEN',
          'Connect Stripe via OAuth (GET /api/stripe/connect). Platform self-connect is disabled.',
          403
        )
      );
    }

    const { user, workspaceId } = await requireWorkspace(request);
    const membership = await getAccountMembership(user.id);
    if (!membership) {
      return withCors(request, jsonError('ACCOUNT_REQUIRED', 'No account.', 403));
    }

    const platform = await getStripePlatformAccount();
    const check = await enforceStripeConnect(
      membership.account_id,
      workspaceId,
      platform.id ?? undefined
    );
    if (!check.allowed) {
      return withCors(
        request,
        jsonError('PLAN_LIMIT', check.reason ?? 'Plan limit reached.', 403)
      );
    }

    const result = await connectPlatformStripeAccount(workspaceId, user.id);

    return ok(request, {
      connected: true,
      stripeAccountId: result.stripeAccountId,
      displayName: result.displayName,
      connectionType: 'platform_self',
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
