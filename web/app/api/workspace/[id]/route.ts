import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';
import type { ManualJournalPostMode } from '@stripesync/shared';

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

    const body = await request.json();
    const updates: {
      name?: string;
      manual_journal_post_mode?: ManualJournalPostMode;
    } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return withCors(
          request,
          jsonError('VALIDATION_ERROR', 'Workspace name is required.', 400)
        );
      }
      updates.name = body.name.trim();
    }

    if (body.manualJournalPostMode !== undefined) {
      if (
        body.manualJournalPostMode !== 'draft_only' &&
        body.manualJournalPostMode !== 'draft_and_post'
      ) {
        return withCors(
          request,
          jsonError(
            'VALIDATION_ERROR',
            'Manual journal post mode must be draft_only or draft_and_post.',
            400
          )
        );
      }
      updates.manual_journal_post_mode = body.manualJournalPostMode;
    }

    if (Object.keys(updates).length === 0) {
      return withCors(
        request,
        jsonError(
          'VALIDATION_ERROR',
          'Provide name and/or manualJournalPostMode to update.',
          400
        )
      );
    }

    const admin = createSupabaseAdmin();
    const { data: ws, error } = await core(admin)
      .from('workspaces')
      .update(updates)
      .eq('id', params.id)
      .select('id, name, created_at, manual_journal_post_mode')
      .single();

    if (error || !ws) {
      return withCors(
        request,
        jsonError('DB_ERROR', error?.message ?? 'Failed to update workspace.', 500)
      );
    }

    return ok(request, {
      id: ws.id,
      name: ws.name,
      created_at: ws.created_at,
      manualJournalPostMode:
        ws.manual_journal_post_mode === 'draft_only'
          ? 'draft_only'
          : 'draft_and_post',
    });
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
