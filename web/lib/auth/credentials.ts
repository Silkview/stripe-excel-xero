import type { AuthError, Session, SupabaseClient } from '@supabase/supabase-js';
import {
  messageForSignInFailure,
  type SignInHint,
} from '@/lib/auth/signin-hint';

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function formatAuthError(error: AuthError): string {
  const msg = error.message ?? 'Sign-in failed.';
  const code = error.code ?? '';

  if (
    code === 'email_not_confirmed' ||
    /email not confirmed/i.test(msg)
  ) {
    return 'Confirm your email before signing in. Check your inbox for the signup link, or resend confirmation below.';
  }

  if (
    code === 'invalid_credentials' ||
    /invalid login credentials/i.test(msg)
  ) {
    return 'Email or password is incorrect, or your email is not confirmed yet. If you just signed up, open the confirmation link in your inbox first.';
  }

  if (code === 'user_not_found' || /user not found/i.test(msg)) {
    return 'No account found for this email. Create an account first, then confirm your email if prompted.';
  }

  return msg;
}

export type PasswordSignInResult =
  | { ok: true; session: Session }
  | { ok: false; message: string };

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

function agentLog(
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

export async function signInWithPassword(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<PasswordSignInResult> {
  const normalizedEmail = normalizeAuthEmail(email);
  const fp = emailFingerprint(normalizedEmail);

  let supabaseHost = 'unknown';
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    supabaseHost = url ? new URL(url).host : 'missing-env';
  } catch {
    supabaseHost = 'invalid-url';
  }

  agentLog('D', 'credentials.ts:signIn', 'signIn attempt start', {
    supabaseHost,
    origin: typeof window !== 'undefined' ? window.location.origin : 'server',
    emailFingerprint: fp,
    passwordLength: password.length,
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    agentLog('A', 'credentials.ts:signIn', 'signIn error from Supabase', {
      supabaseHost,
      emailFingerprint: fp,
      errorCode: error.code ?? null,
      errorStatus: (error as { status?: number }).status ?? null,
      errorMessage: error.message,
    });

    const isInvalidCredentials =
      error.code === 'invalid_credentials' ||
      /invalid login credentials/i.test(error.message);

    agentLog('C', 'credentials.ts:signIn', 'invalid credentials branch', {
      supabaseHost,
      emailFingerprint: fp,
      isInvalidCredentials,
    });

    let hint: SignInHint | null = null;
    if (typeof window !== 'undefined' && isInvalidCredentials) {
      try {
        const hintRes = await fetch('/api/auth/signin-hint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        });
        const hintJson = await hintRes.json().catch(() => null);
        hint = (hintJson?.data ?? null) as SignInHint | null;

        agentLog('B', 'credentials.ts:signIn', 'signin-hint lookup', {
          emailFingerprint: fp,
          httpStatus: hintRes.status,
          userFound: hint?.userFound ?? null,
          emailConfirmed: hint?.emailConfirmed ?? null,
        });
      } catch (lookupErr) {
        agentLog('B', 'credentials.ts:signIn', 'signin-hint fetch failed', {
          emailFingerprint: fp,
          lookupError:
            lookupErr instanceof Error ? lookupErr.message : 'unknown',
        });
      }
    }

    const message =
      hint && isInvalidCredentials
        ? messageForSignInFailure(hint, formatAuthError(error))
        : formatAuthError(error);

    agentLog('B', 'credentials.ts:signIn', 'resolved sign-in message', {
      emailFingerprint: fp,
      userFound: hint?.userFound ?? null,
      messageKind: !hint?.userFound
        ? 'no_account'
        : !hint?.emailConfirmed
          ? 'unconfirmed'
          : hint?.hasEmailPasswordIdentity === false
            ? 'no_password_identity'
            : 'wrong_password',
    });

    return { ok: false, message };
  }

  if (!data.session) {
    agentLog('A', 'credentials.ts:signIn', 'no session after signIn', {
      supabaseHost,
      emailFingerprint: fp,
      hasUser: Boolean(data.user),
    });
    return {
      ok: false,
      message:
        'Sign-in did not return a session. Confirm your email if you just signed up, then try again.',
    };
  }

  agentLog('A', 'credentials.ts:signIn', 'signIn success', {
    supabaseHost,
    emailFingerprint: fp,
    hasSession: true,
  });

  return { ok: true, session: data.session };
}

export async function syncBrowserSessionToServer(
  session: Session
): Promise<void> {
  await fetch('/api/auth/session', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }),
  });
}

export async function resendSignupConfirmation(
  supabase: SupabaseClient,
  email: string
): Promise<{ ok: boolean; message: string }> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizeAuthEmail(email),
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: 'Confirmation email sent. Open the link, then sign in again.',
  };
}
