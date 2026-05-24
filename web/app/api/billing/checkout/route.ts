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

    const { plan } = await request.json();
    if (plan !== 'pro' && plan !== 'firm') {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Plan must be pro or firm.', 400)
      );
    }

    const returnUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4003';
    const session = await createCheckoutSession(
      membership.account_id,
      user.email!,
      plan,
      `${returnUrl}/dashboard`
    );

    return ok(request, { url: session.url });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
