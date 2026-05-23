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

function tokenFromDialogPayload(payload: Record<string, unknown>): string | null {
  if (
    payload.status === 'signed_in' &&
    typeof payload.accessToken === 'string' &&
    payload.accessToken.length > 0
  ) {
    return payload.accessToken;
  }
  return null;
}

async function fetchHandoffToken(
  handoff: string,
  origin: string
): Promise<string | null> {
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
  return null;
}

/** Poll handoff until token or deadline. Resolves as soon as excel-finish stores the token. */
function pollExcelHandoff(
  handoff: string,
  maxMs = 120000,
  intervalMs = 800
): Promise<string> {
  const origin = getOfficeAuthOrigin();
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + maxMs;
    const tick = async () => {
      if (Date.now() >= deadline) {
        reject(new Error('Sign-in timed out waiting for the server handoff.'));
        return;
      }
      const token = await fetchHandoffToken(handoff, origin);
      if (token) {
        resolve(token);
        return;
      }
      await sleep(intervalMs);
      void tick();
    };
    void tick();
  });
}

function dialogTokenPromise(loginUrl: string): Promise<string> {
  return openAuthDialog(loginUrl).then((payload) => {
    const token = tokenFromDialogPayload(payload);
    if (token) return token;
    throw new Error('Dialog closed without a session token.');
  });
}

/**
 * Excel sign-in: race Office messageParent vs server handoff so we do not depend
 * on the dialog closing (messageParent can fail while the web page shows success).
 */
async function acquireExcelSessionToken(
  loginUrl: string,
  handoff: string
): Promise<{ token: string; via: 'dialog' | 'handoff' }> {
  const handoffTask = pollExcelHandoff(handoff).then((token) => ({
    token,
    via: 'handoff' as const,
  }));
  const dialogTask = dialogTokenPromise(loginUrl).then((token) => ({
    token,
    via: 'dialog' as const,
  }));

  try {
    return await Promise.race([handoffTask, dialogTask]);
  } catch {
    const results = await Promise.allSettled([handoffTask, dialogTask]);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        return result.value;
      }
    }
    const reason = results.find((r) => r.status === 'rejected') as
      | PromiseRejectedResult
      | undefined;
    throw reason?.reason ?? new Error('Sign-in did not complete.');
  }
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

    try {
      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'useAuth:signIn',message:'opening auth dialog',data:{loginUrl,handoff},timestamp:Date.now(),hypothesisId:'H8',runId:'post-fix-v4'})}).catch(()=>{});
      // #endregion

      const { token, via } = await acquireExcelSessionToken(loginUrl, handoff);

      setAccessToken(token);
      setSignedIn(true);

      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'useAuth:signIn',message:'signed in',data:{via,hasToken:!!token},timestamp:Date.now(),hypothesisId:'H8',runId:'post-fix-v4'})}).catch(()=>{});
      // #endregion

      await auditDialogAuth({
        location: 'useAuth:signIn',
        message: 'success',
        data: { via },
        hypothesisId: 'H8',
        runId: 'post-fix-v4',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed.';
      await auditDialogAuth({
        location: 'useAuth:signIn',
        message: 'error',
        data: { msg },
        hypothesisId: 'H8',
        runId: 'post-fix-v4',
      });
      setError(
        msg.includes('cancelled') || msg.includes('timed out')
          ? msg
          : `${msg} Complete MFA if prompted, wait for “Signed in to Excel”, then return to the task pane.`
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
