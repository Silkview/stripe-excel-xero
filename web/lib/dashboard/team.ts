import { getPrimaryAccountMembership } from '@/lib/auth/account-membership';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';

export type TeamMemberRow = {
  id: string;
  type: 'member';
  user_id: string;
  email: string;
  name: string;
  role: string;
  workspaceNames: string[];
  status: 'active';
};

export type TeamInviteRow = {
  id: string;
  type: 'invite';
  email: string;
  role: string;
  workspaceNames: string[];
  workspaceIds: string[];
  status: 'pending';
  token: string;
  created_at: string;
};

export type TeamListResult = {
  members: TeamMemberRow[];
  invites: TeamInviteRow[];
};

async function workspaceNamesForIds(
  workspaceIds: string[]
): Promise<string[]> {
  if (!workspaceIds.length) return [];
  const admin = createSupabaseAdmin();
  const { data } = await core(admin)
    .from('workspaces')
    .select('name')
    .in('id', workspaceIds);
  return (data ?? []).map((w) => w.name);
}

export async function listTeamForAccount(
  accountId: string
): Promise<TeamListResult> {
  const admin = createSupabaseAdmin();

  const { data: members } = await core(admin)
    .from('account_users')
    .select('id, user_id, role')
    .eq('account_id', accountId);

  const memberRows: TeamMemberRow[] = [];

  for (const m of members ?? []) {
    const { data: authUser } = await admin.auth.admin.getUserById(m.user_id);
    const email = authUser?.user?.email ?? 'Unknown';
    const name = email.split('@')[0] ?? email;

    let workspaceIds: string[] = [];
    if (m.role === 'owner' || m.role === 'admin') {
      const { data: allWs } = await core(admin)
        .from('workspaces')
        .select('id')
        .eq('account_id', accountId);
      workspaceIds = (allWs ?? []).map((w) => w.id);
    } else {
      const { data: scoped } = await core(admin)
        .from('account_user_workspaces')
        .select('workspace_id')
        .eq('account_user_id', m.id);
      workspaceIds = (scoped ?? []).map((s) => s.workspace_id);
    }

    memberRows.push({
      id: m.id,
      type: 'member',
      user_id: m.user_id,
      email,
      name,
      role: m.role,
      workspaceNames: await workspaceNamesForIds(workspaceIds),
      status: 'active',
    });
  }

  const { data: invites } = await core(admin)
    .from('account_invitations')
    .select('id, email, role, token, created_at')
    .eq('account_id', accountId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  const inviteRows: TeamInviteRow[] = [];

  for (const inv of invites ?? []) {
    const { data: iw } = await core(admin)
      .from('invitation_workspaces')
      .select('workspace_id')
      .eq('invitation_id', inv.id);

    const workspaceIds = (iw ?? []).map((r) => r.workspace_id);
    inviteRows.push({
      id: inv.id,
      type: 'invite',
      email: inv.email,
      role: inv.role,
      workspaceNames: await workspaceNamesForIds(workspaceIds),
      workspaceIds,
      status: 'pending',
      token: inv.token,
      created_at: inv.created_at ?? '',
    });
  }

  return { members: memberRows, invites: inviteRows };
}

export async function acceptInvitation(
  userId: string,
  email: string,
  token: string
): Promise<{ accountId: string }> {
  const admin = createSupabaseAdmin();
  const normalized = email.trim().toLowerCase();

  const { data: inv } = await core(admin)
    .from('account_invitations')
    .select('id, account_id, email, role, accepted_at, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!inv || inv.accepted_at) {
    throw new Error('Invitation is invalid or already used.');
  }

  if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
    throw new Error('Invitation has expired.');
  }

  if (inv.email.trim().toLowerCase() !== normalized) {
    throw new Error('This invitation was sent to a different email address.');
  }

  const existing = await getPrimaryAccountMembership(userId);
  if (existing) {
    throw new Error('You already belong to an account.');
  }

  const { data: au, error: auErr } = await core(admin)
    .from('account_users')
    .insert({
      account_id: inv.account_id,
      user_id: userId,
      role: inv.role === 'admin' ? 'admin' : 'member',
    })
    .select('id')
    .single();

  if (auErr || !au) {
    throw new Error(auErr?.message ?? 'Failed to join account.');
  }

  const { data: iw } = await core(admin)
    .from('invitation_workspaces')
    .select('workspace_id')
    .eq('invitation_id', inv.id);

  for (const row of iw ?? []) {
    await core(admin).from('account_user_workspaces').upsert(
      {
        account_user_id: au.id,
        workspace_id: row.workspace_id,
      },
      { onConflict: 'account_user_id,workspace_id' }
    );
  }

  await core(admin)
    .from('account_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', inv.id);

  return { accountId: inv.account_id };
}
