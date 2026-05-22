import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import { lookupAuthUserByEmail } from '@/lib/auth/signin-hint';
import { jsonError, jsonSuccess } from '@/lib/api-response';

function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  // #region agent log
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '49b4e5',
    },
    body: JSON.stringify({
      sessionId: '49b4e5',
      runId: 'pre-fix',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function emailFingerprint(email: string): {
  length: number;
  domain: string | null;
} {
  const parts = email.split('@');
  return {
    length: email.length,
    domain: parts.length === 2 ? parts[1] : null,
  };
}

/** Dev-only: inspect auth.users state for a failed sign-in (no email in logs). */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return jsonError('FORBIDDEN', 'Not available in production.', 403);
  }

  const body = await req.json().catch(() => ({}));
  const rawEmail = typeof body.email === 'string' ? body.email : '';
  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    return jsonError('VALIDATION_ERROR', 'email is required.', 400);
  }

  const { url } = getSupabasePublicEnv();
  let supabaseHost = 'unknown';
  try {
    supabaseHost = new URL(url).host;
  } catch {
    supabaseHost = 'invalid-url';
  }

  const fp = emailFingerprint(email);

  try {
    const admin = createSupabaseAdmin();
    const hint = await lookupAuthUserByEmail(admin, email);

    debugLog('A', 'debug-status/route.ts:lookup', 'auth user lookup', {
      supabaseHost,
      emailFingerprint: fp,
      userFound: hint.userFound,
      emailConfirmed: hint.emailConfirmed,
      hasPasswordIdentity: hint.hasEmailPasswordIdentity,
    });

    debugLog('B', 'debug-status/route.ts:lookup', 'user missing check', {
      supabaseHost,
      emailFingerprint: fp,
      userFound: hint.userFound,
    });

    return jsonSuccess({
      ...hint,
      supabaseHost,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'debug lookup failed';
    debugLog('D', 'debug-status/route.ts:catch', 'debug route exception', {
      supabaseHost,
      emailFingerprint: fp,
      error: message,
    });
    return jsonError('DEBUG_ERROR', message, 500);
  }
}
