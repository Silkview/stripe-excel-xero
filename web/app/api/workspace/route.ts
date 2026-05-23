import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { enforceLimit } from '@/lib/plan-limits';
import { listWorkspacesForUser } from '@/lib/dashboard/workspaces';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const workspaces = await listWorkspacesForUser(user.id);
    return ok(request, { workspaces });
  } catch (err) {
    return handleRouteError(request, err);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request);
    const membership = await getAccountMembership(user.id);
    if (!membership || membership.role === 'member') {
      return withCors(request, jsonError('FORBIDDEN', 'Admins only.', 403));
    }

    const { name } = await request.json();
    if (!name?.trim()) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Workspace name is required.', 400)
      );
    }

    const check = await enforceLimit(membership.account_id, 'workspace');
    if (!check.allowed) {
      return withCors(request, jsonError('PLAN_LIMIT', check.reason!, 403));
    }

    const admin = createSupabaseAdmin();
    const { data: ws, error } = await core(admin)
      .from('workspaces')
      .insert({
        account_id: membership.account_id,
        name: name.trim(),
        created_by: user.id,
      })
      .select('id, name, created_at')
      .single();

    if (error || !ws) {
      return withCors(
        request,
        jsonError('DB_ERROR', error?.message ?? 'Failed to create workspace.', 500)
      );
    }

    return ok(
      request,
      {
        ...ws,
        xero: null,
        stripe: [],
      },
      201
    );
  } catch (err) {
    return handleRouteError(request, err);
  }
}
