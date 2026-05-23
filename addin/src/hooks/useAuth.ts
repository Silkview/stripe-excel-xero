import { useState, useCallback } from 'react';
import {
  getAccessToken,
  setAccessToken,
  clearSession,
} from '../utils/session';
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
      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'useAuth:signIn',message:'opening auth dialog',data:{loginUrl},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      const payload = await openAuthDialog(loginUrl);
      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'useAuth:signIn',message:'dialog resolved',data:{status:payload?.status,hasToken:typeof payload?.accessToken==='string'},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
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
    clearSession();
    setSignedIn(false);
    setError(null);
  }, []);

  const invalidateSession = signOut;

  return { signedIn, loading, error, signIn, signOut, invalidateSession };
}
