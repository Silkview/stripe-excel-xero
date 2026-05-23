import type { SupabaseClient, User } from '@supabase/supabase-js';
import { acceptInvitation } from '@/lib/dashboard/team';
import { resolveInviteToken } from './pending-invite';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * If the user has a pending invite token, accept it before onboarding/MFA routing.
 */
export async function acceptPendingInviteIfNeeded(
  user: User,
  returnPath?: string | null
): Promise<boolean> {
  const token = resolveInviteToken(
    returnPath ?? null,
    user.user_metadata as Record<string, unknown>
  );
  if (!token || !user.email) return false;

  try {
    await acceptInvitation(user.id, user.email, token);

    const admin = createSupabaseAdmin();
    const meta = { ...(user.user_metadata as Record<string, unknown>) };
    if (meta.invite_token) {
      delete meta.invite_token;
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: meta,
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function acceptPendingInviteForSession(
  supabase: SupabaseClient,
  returnPath?: string | null
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  return acceptPendingInviteIfNeeded(user, returnPath);
}
