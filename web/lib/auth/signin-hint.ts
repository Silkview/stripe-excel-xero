
export type SignInHint = {
  userFound: boolean;
  emailConfirmed: boolean;
  hasEmailPasswordIdentity: boolean;
};

/** Service-role lookup in auth.users (no email logged). */
import type { AdminClient } from '@/lib/supabase/admin';

export async function lookupAuthUserByEmail(
  admin: AdminClient,
  email: string
): Promise<SignInHint> {
  const normalized = email.trim().toLowerCase();
  let page = 1;

  for (let i = 0; i < 10; i++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error || !data.users.length) {
      return {
        userFound: false,
        emailConfirmed: false,
        hasEmailPasswordIdentity: false,
      };
    }

    const match = data.users.find(
      (u) => u.email?.trim().toLowerCase() === normalized
    );

    if (match) {
      const identities = (match.identities ?? []).map((id) => id.provider);
      const result = {
        userFound: true,
        emailConfirmed: Boolean(match.email_confirmed_at),
        hasEmailPasswordIdentity: identities.includes('email'),
      };
      // #region agent log
      fetch(
        'http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'aa61bb',
          },
          body: JSON.stringify({
            sessionId: 'aa61bb',
            location: 'web/lib/auth/signin-hint.ts:lookupAuthUserByEmail',
            hypothesisId: 'H_LOGIN_HINT',
            message: 'hint:user-matched',
            data: {
              ...result,
              providers: identities,
              identityCount: match.identities?.length ?? 0,
              hasIdentitiesField: match.identities != null,
              page,
            },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
      // #endregion
      return result;
    }

    if (!data.nextPage) break;
    page = data.nextPage;
  }

  // #region agent log
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'aa61bb',
    },
    body: JSON.stringify({
      sessionId: 'aa61bb',
      location: 'web/lib/auth/signin-hint.ts:lookupAuthUserByEmail',
      hypothesisId: 'H_LOGIN_HINT',
      message: 'hint:no-user-after-scan',
      data: { pagesScanned: page },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    userFound: false,
    emailConfirmed: false,
    hasEmailPasswordIdentity: false,
  };
}

export function messageForSignInFailure(
  hint: SignInHint,
  fallback: string
): string {
  if (!hint.userFound) {
    return (
      'No account exists for this email. Create an account, or check for typos ' +
      '(for example .org vs .org.au).'
    );
  }

  if (!hint.emailConfirmed) {
    return (
      'Confirm your email before signing in. Check your inbox for the signup link, ' +
      'or resend confirmation below.'
    );
  }

  if (!hint.hasEmailPasswordIdentity) {
    return (
      'This account was created with a magic link or social sign-in. Use “Send magic link” ' +
      'or reset your password from the sign-in page.'
    );
  }

  return 'Incorrect password. Try again or use password reset in Supabase if you forgot it.';
}
