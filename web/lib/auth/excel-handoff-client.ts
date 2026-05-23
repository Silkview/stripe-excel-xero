import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { navigateExcelAuth } from './excel-navigation';

/** Store session for Excel add-in handoff polling (works even if Office messageParent fails). */
export async function persistExcelHandoff(
  handoff: string | null | undefined,
  accessToken: string | null | undefined
): Promise<void> {
  if (!handoff?.trim() || !accessToken?.trim()) return;
  try {
    await fetch('/api/auth/excel-handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        nonce: handoff.trim(),
        accessToken: accessToken.trim(),
      }),
    });
  } catch {
    // Non-fatal; excel-finish may still save server-side
  }
}

/** Refresh session, persist handoff token, then open the Office finish page. */
export async function navigateExcelFinish(
  handoff: string | null | undefined
): Promise<void> {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.auth.refreshSession();
  if (!error && data.session?.access_token) {
    await persistExcelHandoff(handoff, data.session.access_token);
  }
  navigateExcelAuth('/api/auth/excel-finish', handoff ?? null);
}

export function isExcelFinishPath(path: string): boolean {
  return (
    path === '/api/auth/excel-finish' ||
    path.startsWith('/api/auth/excel-finish?')
  );
}

/** Persist handoff when redirecting to excel-finish (any entry path). */
export async function navigateExcelAuthWithHandoff(
  path: string,
  handoff: string | null | undefined
): Promise<void> {
  if (isExcelFinishPath(path)) {
    await navigateExcelFinish(handoff);
    return;
  }
  navigateExcelAuth(path, handoff ?? null);
}
