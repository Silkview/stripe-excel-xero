/** Extract invite token from /auth/invite?token=… return paths. */
export function extractInviteTokenFromReturnPath(
  returnPath: string | null
): string | null {
  if (!returnPath) return null;
  try {
    const url = returnPath.startsWith('/')
      ? new URL(returnPath, 'http://local')
      : new URL(returnPath);
    if (!url.pathname.endsWith('/auth/invite')) return null;
    const token = url.searchParams.get('token');
    return token?.trim() || null;
  } catch {
    return null;
  }
}

export function inviteReturnPath(token: string): string {
  return `/auth/invite?token=${encodeURIComponent(token)}`;
}
