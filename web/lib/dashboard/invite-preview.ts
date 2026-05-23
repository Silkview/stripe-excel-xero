import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';

export type InvitePreview = {
  email: string;
  accountName: string;
  inviterName: string;
  workspaceNames: string[];
  role: string;
};

async function workspaceNamesForIds(workspaceIds: string[]): Promise<string[]> {
  if (!workspaceIds.length) return [];
  const admin = createSupabaseAdmin();
  const { data } = await core(admin)
    .from('workspaces')
    .select('name')
    .in('id', workspaceIds);
  return (data ?? []).map((w) => w.name);
}

export async function getInvitePreviewByToken(
  token: string
): Promise<InvitePreview | null> {
  const admin = createSupabaseAdmin();

  const { data: inv } = await core(admin)
    .from('account_invitations')
    .select('id, email, role, accepted_at, expires_at, account_id, invited_by')
    .eq('token', token)
    .maybeSingle();

  if (!inv || inv.accepted_at) return null;

  if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
    return null;
  }

  const { data: account } = await core(admin)
    .from('accounts')
    .select('name')
    .eq('id', inv.account_id)
    .maybeSingle();

  let inviterName = 'A team member';
  if (inv.invited_by) {
    const { data: authUser } = await admin.auth.admin.getUserById(
      inv.invited_by
    );
    const email = authUser?.user?.email;
    if (email) {
      inviterName = email.split('@')[0] ?? email;
    }
  }

  const { data: iw } = await core(admin)
    .from('invitation_workspaces')
    .select('workspace_id')
    .eq('invitation_id', inv.id);

  const workspaceIds = (iw ?? []).map((r) => r.workspace_id);

  return {
    email: inv.email,
    accountName: account?.name ?? 'your team',
    inviterName,
    workspaceNames: await workspaceNamesForIds(workspaceIds),
    role: inv.role,
  };
}

export function inviteUrl(token: string): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4003'
  ).replace(/\/$/, '');
  return `${base}/auth/invite?token=${encodeURIComponent(token)}`;
}
