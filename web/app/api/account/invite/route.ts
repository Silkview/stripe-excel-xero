import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { enforceLimit } from '@/lib/plan-limits';
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
    if (!membership || membership.role === 'member') {
      return withCors(request, jsonError('FORBIDDEN', 'Not authorised.', 403));
    }

    const { email, role } = await request.json();
    if (!email) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Email is required.', 400)
      );
    }

    const check = await enforceLimit(membership.account_id, 'user');
    if (!check.allowed) {
      return withCors(request, jsonError('PLAN_LIMIT', check.reason!, 403));
    }

    const admin = createSupabaseAdmin();
    const { data: inv, error } = await core(admin)
      .from('account_invitations')
      .insert({
        account_id: membership.account_id,
        email,
        role: role === 'admin' ? 'admin' : 'member',
        invited_by: user.id,
      })
      .select()
      .single();

    if (error || !inv) {
      return withCors(
        request,
        jsonError('DB_ERROR', error?.message ?? 'Failed to create invitation.', 500)
      );
    }

    return ok(request, { inviteId: inv.id, token: inv.token });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
