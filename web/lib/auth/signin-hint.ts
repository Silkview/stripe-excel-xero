
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
      return {
        userFound: true,
        emailConfirmed: Boolean(match.email_confirmed_at),
        hasEmailPasswordIdentity: identities.includes('email'),
      };
    }

    if (!data.nextPage) break;
    page = data.nextPage;
  }

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
