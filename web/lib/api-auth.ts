import { createSupabaseServer } from './supabase/server';
import { createSupabaseAdmin } from './supabase/admin';
import { core } from './supabase/core';

export class ApiAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 401
  ) {
    super(message);
  }
}

function bearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

export async function requireUser(req?: Request) {
  const token = req ? bearerToken(req) : null;
  if (token) {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) {
      throw new ApiAuthError('AUTH_REQUIRED', 'Please sign in to continue.', 401);
    }
    const supabase = await createSupabaseServer();
    return { supabase, user: data.user };
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new ApiAuthError('AUTH_REQUIRED', 'Please sign in to continue.', 401);
  }
  return { supabase, user };
}

export async function requireWorkspace(req: Request) {
  const { supabase, user } = await requireUser(req);
  const workspaceId =
    req.headers.get('x-workspace-id') ||
    req.headers.get('X-Workspace-Id') ||
    '';

  if (!workspaceId) {
    throw new ApiAuthError(
      'WORKSPACE_REQUIRED',
      'Select a workspace before connecting or pulling data.',
      400
    );
  }

  const admin = createSupabaseAdmin();
  const { data: membership } = await core(admin)
    .from('account_users')
    .select('account_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    throw new ApiAuthError('ACCOUNT_REQUIRED', 'No account found for this user.', 403);
  }

  const { data: workspace } = await core(admin)
    .from('workspaces')
    .select('id, account_id')
    .eq('id', workspaceId)
    .eq('account_id', membership.account_id)
    .maybeSingle();

  if (!workspace) {
    throw new ApiAuthError(
      'WORKSPACE_FORBIDDEN',
      'Workspace not found or access denied.',
      403
    );
  }

  return { supabase, user, workspaceId, accountId: membership.account_id };
}

export async function getAccountMembership(
  userId: string
): Promise<{ account_id: string; role: string } | null> {
  const admin = createSupabaseAdmin();
  const { data } = await core(admin)
    .from('account_users')
    .select('account_id, role')
    .eq('user_id', userId)
    .maybeSingle();
  return data as { account_id: string; role: string } | null;
}
