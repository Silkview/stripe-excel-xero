import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { getOnboardingStatusForUser } from '@/lib/auth/onboarding-status';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireUser(request);
    const status = await getOnboardingStatusForUser(
      user.id,
      user.user_metadata as Record<string, unknown>
    );

    if (status.needsAccountSetup) {
      return withCors(
        request,
        jsonError(
          'ONBOARDING_INCOMPLETE',
          'Create a workspace before finishing setup.',
          400
        )
      );
    }

    if (!status.hasXero || !status.hasStripe) {
      return withCors(
        request,
        jsonError(
          'ONBOARDING_INCOMPLETE',
          'Connect Xero and Stripe before finishing setup.',
          400
        )
      );
    }

    const membership = await getAccountMembership(user.id);
    if (!membership) {
      return withCors(request, jsonError('ACCOUNT_REQUIRED', 'No account.', 403));
    }

    const admin = createSupabaseAdmin();
    await core(admin)
      .from('accounts')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', membership.account_id);

    return ok(request, { completed: true });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
