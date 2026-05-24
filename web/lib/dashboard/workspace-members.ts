import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';

export type WorkspaceMemberRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
};

function initialsFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || '?';
}

export async function listMembersForWorkspace(
  accountId: string,
  workspaceId: string
): Promise<WorkspaceMemberRow[]> {
  const admin = createSupabaseAdmin();

  const { data: members } = await core(admin)
    .from('account_users')
    .select('id, user_id, role')
    .eq('account_id', accountId);

  if (!members?.length) return [];

  const rows: WorkspaceMemberRow[] = [];

  for (const m of members) {
    const isAdmin = m.role === 'owner' || m.role === 'admin';
    if (!isAdmin) {
      const { data: scoped } = await core(admin)
        .from('account_user_workspaces')
        .select('workspace_id')
        .eq('account_user_id', m.id)
        .eq('workspace_id', workspaceId)
        .maybeSingle();
      if (!scoped) continue;
    }

    const { data: authUser } = await admin.auth.admin.getUserById(m.user_id);
    const email = authUser?.user?.email ?? 'Unknown';
    const name = email.split('@')[0] ?? email;

    rows.push({
      id: m.id,
      email,
      name,
      role: m.role,
      initials: initialsFromEmail(email),
    });
  }

  return rows.sort((a, b) => {
    const order = { owner: 0, admin: 1, member: 2 };
    const ao = order[a.role as keyof typeof order] ?? 3;
    const bo = order[b.role as keyof typeof order] ?? 3;
    if (ao !== bo) return ao - bo;
    return a.email.localeCompare(b.email);
  });
}
