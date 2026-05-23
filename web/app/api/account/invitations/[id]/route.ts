import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await requireUser(request);
    const membership = await getAccountMembership(user.id);
    if (!membership || membership.role === 'member') {
      return withCors(request, jsonError('FORBIDDEN', 'Not authorised.', 403));
    }

    const admin = createSupabaseAdmin();
    const { error } = await core(admin)
      .from('account_invitations')
      .delete()
      .eq('id', id)
      .eq('account_id', membership.account_id)
      .is('accepted_at', null);

    if (error) {
      return withCors(
        request,
        jsonError('DB_ERROR', error.message, 500)
      );
    }

    return ok(request, { revoked: true });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
