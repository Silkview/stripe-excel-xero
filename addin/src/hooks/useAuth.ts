import { useState, useCallback } from 'react';
import {
  getAccessToken,
  setAccessToken,
  clearSession,
} from '../utils/session';
import { openAuthDialog } from '../utils/dialogAuth';
import { getOfficeAuthOrigin } from '../utils/officeAuthUrl';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function auditDialogAuth(data: Record<string, unknown>) {
  try {
    await fetch(`${getOfficeAuthOrigin()}/api/auth/login-audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    // Non-fatal
  }
}

async function pollExcelHandoff(
  handoff: string,
  maxMs = 120000
): Promise<string | null> {
  const origin = getOfficeAuthOrigin();
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(
        `${origin}/api/auth/excel-handoff?nonce=${encodeURIComponent(handoff)}`
      );
      const data = await res.json().catch(() => null);
      if (
        data?.success &&
        data.data?.ready &&
        typeof data.data.accessToken === 'string'
      ) {
        return data.data.accessToken;
      }
    } catch {
      // keep polling
    }
    await sleep(1500);
  }
  return null;
}

function applySignedInToken(token: string) {
  setAccessToken(token);
}

export function useAuth() {
  const [signedIn, setSignedIn] = useState(!!getAccessToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    const handoff = crypto.randomUUID();
    const origin = getOfficeAuthOrigin();
    const loginUrl = `${origin}/auth/excel?handoff=${encodeURIComponent(handoff)}`;
    const handoffPoll = pollExcelHandoff(handoff);

    try {
      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'useAuth:signIn',message:'opening auth dialog',data:{loginUrl,handoff},timestamp:Date.now(),hypothesisId:'H7',runId:'post-fix-v3'})}).catch(()=>{});
      // #endregion
      const payload = await openAuthDialog(loginUrl);
      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'useAuth:signIn',message:'dialog resolved',data:{status:payload?.status,hasToken:typeof payload?.accessToken==='string'},timestamp:Date.now(),hypothesisId:'H7',runId:'post-fix-v3'})}).catch(()=>{});
      // #endregion
      if (
        payload.status === 'signed_in' &&
        typeof payload.accessToken === 'string'
      ) {
        applySignedInToken(payload.accessToken);
        setSignedIn(true);
        await auditDialogAuth({
          location: 'useAuth:signIn',
          message: 'dialog success',
          data: { hasToken: true },
          hypothesisId: 'H7',
          runId: 'post-fix-v3',
        });
        return;
      }

      const handoffToken = await handoffPoll;
      if (handoffToken) {
        applySignedInToken(handoffToken);
        setSignedIn(true);
        await auditDialogAuth({
          location: 'useAuth:signIn',
          message: 'handoff success after incomplete dialog payload',
          hypothesisId: 'H7',
          runId: 'post-fix-v3',
        });
        return;
      }

      setError(
        'Sign-in did not finish. Use password on the Excel sign-in page, complete MFA if prompted, then return to Excel.'
      );
    } catch (err) {
      const handoffToken = await handoffPoll;
      if (handoffToken) {
        applySignedInToken(handoffToken);
        setSignedIn(true);
        await auditDialogAuth({
          location: 'useAuth:signIn',
          message: 'handoff success after dialog error',
          data: {
            err: err instanceof Error ? err.message : 'unknown',
          },
          hypothesisId: 'H7',
          runId: 'post-fix-v3',
        });
        return;
      }

      const msg = err instanceof Error ? err.message : 'Sign in failed.';
      await auditDialogAuth({
        location: 'useAuth:signIn',
        message: 'dialog error',
        data: { msg },
        hypothesisId: 'H7',
        runId: 'post-fix-v3',
      });
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
