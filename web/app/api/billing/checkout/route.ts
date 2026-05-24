import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { createCheckoutSession } from '@/lib/stripe-billing';
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

    const body = await request.json();
    const { plan, interval = 'monthly' } = body;
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

    const returnUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4003';
    const session = await createCheckoutSession(
      membership.account_id,
      user.email!,
      plan,
      interval,
      `${returnUrl}/dashboard/billing`
    );

    return ok(request, { url: session.url });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Stripe price')) {
      return withCors(
        request,
        jsonError('BILLING_CONFIG', err.message, 400)
      );
    }
    return handleRouteError(request, err);
  }
}
