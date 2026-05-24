import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

async function requireAdminWorkspace(
  userId: string,
  workspaceId: string
): Promise<{ accountId: string }> {
  const membership = await getAccountMembership(userId);
  if (!membership || membership.role === 'member') {
    throw Object.assign(new Error('Admins only.'), {
      code: 'FORBIDDEN',
      status: 403,
    });
  }

  const admin = createSupabaseAdmin();
  const { data: workspace } = await core(admin)
    .from('workspaces')
    .select('id, account_id')
    .eq('id', workspaceId)
    .eq('account_id', membership.account_id)
    .maybeSingle();

  if (!workspace) {
    throw Object.assign(new Error('Workspace not found.'), {
      code: 'NOT_FOUND',
      status: 404,
    });
  }

  return { accountId: membership.account_id };
}

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireUser(request);
    await requireAdminWorkspace(user.id, params.id);

    const { name } = await request.json();
    if (!name?.trim()) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Workspace name is required.', 400)
      );
    }

    const admin = createSupabaseAdmin();
    const { data: ws, error } = await core(admin)
      .from('workspaces')
      .update({ name: name.trim() })
      .eq('id', params.id)
      .select('id, name, created_at')
      .single();

    if (error || !ws) {
      return withCors(
        request,
        jsonError('DB_ERROR', error?.message ?? 'Failed to rename workspace.', 500)
      );
    }

    return ok(request, ws);
  } catch (err) {
    return handleRouteError(request, err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireUser(request);
    const { accountId } = await requireAdminWorkspace(user.id, params.id);

    const admin = createSupabaseAdmin();
    const { count } = await core(admin)
      .from('workspaces')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if ((count ?? 0) <= 1) {
      return withCors(
        request,
        jsonError(
          'VALIDATION_ERROR',
          'You must keep at least one workspace on your account.',
          400
        )
      );
    }

    const { error } = await core(admin)
      .from('workspaces')
      .delete()
      .eq('id', params.id);

    if (error) {
      return withCors(
        request,
        jsonError('DB_ERROR', error.message, 500)
      );
    }

    return ok(request, { deleted: true });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
