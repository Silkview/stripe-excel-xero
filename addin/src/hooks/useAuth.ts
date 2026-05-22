import { useState, useCallback } from 'react';
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/session';
import { openAuthDialog } from '../utils/dialogAuth';
import { getOfficeAuthOrigin } from '../utils/officeAuthUrl';

export function useAuth() {
  const [signedIn, setSignedIn] = useState(!!getAccessToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loginUrl = `${getOfficeAuthOrigin()}/auth/excel`;
      const payload = await openAuthDialog(loginUrl);
      if (
        payload.status === 'signed_in' &&
        typeof payload.accessToken === 'string'
      ) {
        setAccessToken(payload.accessToken);
        setSignedIn(true);
      } else {
        setError(
          'Sign-in did not finish. Use password on the Excel sign-in page, complete MFA if prompted, then return to Excel.'
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed.';
      setError(
        msg.includes('cancelled')
          ? msg
          : `${msg} If the dialog closed early, try again and complete MFA if shown.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    clearAccessToken();
    setSignedIn(false);
  }, []);

  return { signedIn, loading, error, signIn, signOut };
}
