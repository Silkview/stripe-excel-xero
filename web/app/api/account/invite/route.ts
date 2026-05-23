import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { enforceLimit } from '@/lib/plan-limits';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';
import { sendInviteEmail } from '@/lib/email/send-invite-email';
import { inviteUrl } from '@/lib/dashboard/invite-preview';

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
      .select('id, name')
      .eq('account_id', membership.account_id)
      .in('id', workspaceIds);

    if (!validWs?.length || validWs.length !== workspaceIds.length) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Invalid workspace selection.', 400)
      );
    }

    const { data: account } = await core(admin)
      .from('accounts')
      .select('name')
      .eq('id', membership.account_id)
      .single();

    const inviterEmail = user.email ?? '';
    const inviterName = inviterEmail.split('@')[0] || 'A team member';

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
    const workspaceNames = validWs.map((w) => w.name);

    const emailResult = await sendInviteEmail({
      to: email,
      inviteUrl: link,
      accountName: account?.name ?? 'your team',
      inviterName,
      workspaceNames,
      role,
    });

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && !emailResult.sent) {
      return withCors(
        request,
        jsonError(
          'EMAIL_ERROR',
          emailResult.reason === 'not_configured'
            ? 'Email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.'
            : emailResult.message ?? 'Failed to send invitation email.',
          500
        )
      );
    }

    return ok(request, {
      inviteId: inv.id,
      emailSent: emailResult.sent,
      inviteLink: link,
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
