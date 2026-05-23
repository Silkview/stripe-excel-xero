import type { SupabaseClient } from '@supabase/supabase-js';
import {
  extractInviteTokenFromReturnPath,
  inviteReturnPath,
} from './invite-token';

export function getInviteTokenFromUser(
  metadata: Record<string, unknown> | undefined
): string | null {
  const raw = metadata?.invite_token;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

export function resolveInviteToken(
  returnPath: string | null,
  metadata: Record<string, unknown> | undefined
): string | null {
  return (
    extractInviteTokenFromReturnPath(returnPath) ??
    getInviteTokenFromUser(metadata)
  );
}

/** Accept pending invite via API; returns true if accepted or already member. */
export async function tryAcceptPendingInvite(
  token: string
): Promise<{ accepted: boolean; error?: string }> {
  try {
    const res = await fetch('/api/account/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (data.success) {
      return { accepted: true };
    }
    const msg = data.error?.message ?? 'Could not accept invitation.';
    if (
      msg.includes('already belong') ||
      msg.includes('already used')
    ) {
      return { accepted: true };
    }
    return { accepted: false, error: msg };
  } catch {
    return { accepted: false, error: 'Could not accept invitation.' };
  }
}

export async function clearInviteTokenMetadata(
  supabase: SupabaseClient
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.user_metadata?.invite_token) return;
  const meta = { ...(user.user_metadata as Record<string, unknown>) };
  delete meta.invite_token;
  await supabase.auth.updateUser({ data: meta });
}

export { inviteReturnPath };
