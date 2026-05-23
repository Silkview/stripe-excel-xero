import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { enforceLimit } from '@/lib/plan-limits';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

function inviteUrl(token: string): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4003'
  ).replace(/\/$/, '');
  return `${base}/auth/invite?token=${encodeURIComponent(token)}`;
}

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

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const role = body.role === 'admin' ? 'admin' : 'member';
    const workspaceIds = Array.isArray(body.workspaceIds)
      ? (body.workspaceIds as string[]).filter(Boolean)
      : [];

    if (!email) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Email is required.', 400)
      );
    }

    if (!workspaceIds.length) {
      return withCors(
        request,
        jsonError(
          'VALIDATION_ERROR',
          'Select at least one workspace for this invitation.',
          400
        )
      );
    }

    const check = await enforceLimit(membership.account_id, 'user');
    if (!check.allowed) {
      return withCors(request, jsonError('PLAN_LIMIT', check.reason!, 403));
    }

    const admin = createSupabaseAdmin();

    const { data: validWs } = await core(admin)
      .from('workspaces')
      .select('id')
      .eq('account_id', membership.account_id)
      .in('id', workspaceIds);

    if (!validWs?.length || validWs.length !== workspaceIds.length) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Invalid workspace selection.', 400)
      );
    }

    const { data: inv, error } = await core(admin)
      .from('account_invitations')
      .insert({
        account_id: membership.account_id,
        email,
        role,
        invited_by: user.id,
      })
      .select('id, token')
      .single();

    if (error || !inv) {
      return withCors(
        request,
        jsonError('DB_ERROR', error?.message ?? 'Failed to create invitation.', 500)
      );
    }

    await core(admin).from('invitation_workspaces').insert(
      workspaceIds.map((workspace_id) => ({
        invitation_id: inv.id,
        workspace_id,
      }))
    );

    const link = inviteUrl(inv.token);

    return ok(request, {
      inviteId: inv.id,
      token: inv.token,
      inviteLink: link,
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
