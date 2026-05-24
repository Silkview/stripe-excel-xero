import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { createPortalSession } from '@/lib/stripe-billing';
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

    const admin = createSupabaseAdmin();
    const { data: account } = await core(admin)
      .from('accounts')
      .select('stripe_customer_id')
      .eq('id', membership.account_id)
      .single();

    if (!account?.stripe_customer_id) {
      return withCors(
        request,
        jsonError('BILLING_REQUIRED', 'No billing customer on file.', 400)
      );
    }

    const returnUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4003';
    const session = await createPortalSession(
      account.stripe_customer_id,
      `${returnUrl}/dashboard/billing`
    );

    return ok(request, { url: session.url });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
