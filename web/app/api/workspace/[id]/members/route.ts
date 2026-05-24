import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { listMembersForWorkspace } from '@/lib/dashboard/workspace-members';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireUser(request);
    const membership = await getAccountMembership(user.id);
    if (!membership) {
      return withCors(request, jsonError('ACCOUNT_REQUIRED', 'No account.', 403));
    }

    const admin = createSupabaseAdmin();
    const { data: workspace } = await core(admin)
      .from('workspaces')
      .select('id')
      .eq('id', params.id)
      .eq('account_id', membership.account_id)
      .maybeSingle();

    if (!workspace) {
      return withCors(
        request,
        jsonError('NOT_FOUND', 'Workspace not found.', 404)
      );
    }

    if (membership.role === 'member') {
      const { data: au } = await core(admin)
        .from('account_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('account_id', membership.account_id)
        .maybeSingle();
      if (au?.id) {
        const { data: allowed } = await core(admin)
          .from('account_user_workspaces')
          .select('workspace_id')
          .eq('account_user_id', au.id)
          .eq('workspace_id', params.id)
          .maybeSingle();
        if (!allowed) {
          return withCors(
            request,
            jsonError('FORBIDDEN', 'Access denied.', 403)
          );
        }
      }
    }

    const members = await listMembersForWorkspace(
      membership.account_id,
      params.id
    );
    return ok(request, { members });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
