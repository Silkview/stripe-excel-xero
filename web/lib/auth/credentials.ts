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
    code === 'over_email_send_rate_limit' ||
    /email rate limit exceeded/i.test(msg) ||
    /rate limit exceeded/i.test(msg)
  ) {
    return (
      'Too many emails were sent recently. Wait about an hour, check your inbox for an ' +
      'earlier confirmation link, or ask your admin to enable Resend SMTP in Supabase ' +
      '(Authentication → SMTP Settings).'
    );
  }

  if (
    code === 'email_not_confirmed' ||
    /email not confirmed/i.test(msg)
  ) {
    return 'Confirm your email before signing in. Check your inbox for the signup link.';
  }

  if (
    code === 'invalid_credentials' ||
    /invalid login credentials/i.test(msg)
  ) {
    return 'Email or password is incorrect. If you forgot your password, use Forgot password on the sign-in page.';
  }

  if (code === 'user_not_found' || /user not found/i.test(msg)) {
    return 'No account found for this email. Create an account first, then confirm your email if prompted.';
  }

  return msg;
}

export type PasswordSignInResult =
  | { ok: true; session: Session }
  | { ok: false; message: string };

export async function signInWithPassword(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<PasswordSignInResult> {
  const normalizedEmail = normalizeAuthEmail(email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    const isInvalidCredentials =
      error.code === 'invalid_credentials' ||
      /invalid login credentials/i.test(error.message);

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
      } catch {
        // Non-fatal
      }
    }

    const message =
      hint && isInvalidCredentials
        ? messageForSignInFailure(hint, formatAuthError(error))
        : formatAuthError(error);

    return { ok: false, message };
  }

  if (!data.session) {
    return {
      ok: false,
      message:
        'Sign-in did not return a session. Confirm your email if you just signed up, then try again.',
    };
  }

  return { ok: true, session: data.session };
}

export async function syncBrowserSessionToServer(
  session: Session
): Promise<void> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body?.error?.message ?? 'Could not sync session to the server.';
    throw new Error(message);
  }
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
    return { ok: false, message: formatAuthError(error) };
  }

  return {
    ok: true,
    message: 'Confirmation email sent. Open the link, then sign in again.',
  };
}

export async function requestPasswordReset(
  supabase: SupabaseClient,
  email: string
): Promise<{ ok: boolean; message: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    normalizeAuthEmail(email),
    {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    }
  );

  if (error) {
    return { ok: false, message: formatAuthError(error) };
  }

  return {
    ok: true,
    message:
      'If an account exists for that email, we sent a password reset link. Check your inbox.',
  };
}
