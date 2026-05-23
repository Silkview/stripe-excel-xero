import { useState, useCallback } from 'react';
import {
  getAccessToken,
  setAccessToken,
  clearSession,
} from '../utils/session';
import { openAuthDialog } from '../utils/dialogAuth';
import {
  getOfficeAuthOrigin,
  isMisconfiguredAuthOrigin,
} from '../utils/officeAuthUrl';

const HANDOFF_TIMEOUT_MS = 90_000;
const HANDOFF_POLL_MS = 800;

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

type HandoffPollResult =
  | { ok: true; token: string }
  | { ok: false; status: number; ready: boolean; errorCode?: string };

async function fetchHandoffToken(
  handoff: string,
  origin: string
): Promise<HandoffPollResult> {
  const url = `${origin}/api/auth/excel-handoff?nonce=${encodeURIComponent(handoff)}`;
  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => null);
    if (
      data?.success &&
      data.data?.ready &&
      typeof data.data.accessToken === 'string'
    ) {
      return { ok: true, token: data.data.accessToken };
    }
    return {
      ok: false,
      status: res.status,
      ready: Boolean(data?.data?.ready),
      errorCode: data?.error?.code,
    };
  } catch {
    return { ok: false, status: 0, ready: false };
  }
}

type HandoffPoller = {
  promise: Promise<string>;
  wake: () => void;
  pollNow: () => Promise<string | null>;
};

function startExcelHandoffPoll(
  handoff: string,
  origin: string,
  maxMs = HANDOFF_TIMEOUT_MS,
  intervalMs = HANDOFF_POLL_MS
): HandoffPoller {
  let lastPoll: HandoffPollResult = { ok: false, status: 0, ready: false };
  let cancelWait: (() => void) | null = null;
  let pollCount = 0;

  const pollNow = async (): Promise<string | null> => {
    const result = await fetchHandoffToken(handoff, origin);
    lastPoll = result;
  // #region agent log
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'useAuth:poll',message:'handoff poll',data:{pollCount,status:result.ok?200:result.status,ready:result.ok||result.ready,originHost:origin.replace(/^https?:\/\//,'')},timestamp:Date.now(),hypothesisId:'H1-H2'})}).catch(()=>{});
  // #endregion
    pollCount += 1;
    return result.ok ? result.token : null;
  };

  const promise = new Promise<string>((resolve, reject) => {
    const deadline = Date.now() + maxMs;

    const waitInterval = () =>
      new Promise<void>((r) => {
        const timer = setTimeout(r, intervalMs);
        cancelWait = () => {
          clearTimeout(timer);
          r();
        };
      });

    const tick = async () => {
      if (Date.now() >= deadline) {
        await auditDialogAuth({
          location: 'useAuth:handoff',
          message: 'handoff timeout',
          data: {
            origin,
            handoff,
            pollCount,
            lastStatus: lastPoll.ok ? 200 : lastPoll.status,
            lastReady: lastPoll.ok ? true : lastPoll.ready,
            lastErrorCode: lastPoll.ok ? undefined : lastPoll.errorCode,
          },
        });
        reject(
          new Error(
            'Sign-in timed out. The task pane could not read your session from the server. ' +
              'Confirm migration 008_excel_auth_handoffs is applied and the add-in was built with VITE_API_URL=https://www.silkview.org.'
          )
        );
        return;
      }

      const token = await pollNow();
      if (token) {
        resolve(token);
        return;
      }

      cancelWait = null;
      await waitInterval();
      void tick();
    };

    void tick();
  });

  return {
    promise,
    wake: () => {
      cancelWait?.();
    },
    pollNow,
  };
}

/**
 * Excel sign-in: handoff poll (reliable) + messageParent (fast when it works).
 */
async function acquireExcelSessionToken(
  loginUrl: string,
  handoff: string,
  origin: string
): Promise<{ token: string; via: 'dialog' | 'handoff'; authDialog: { close: () => void } }> {
  const handoffPoll = startExcelHandoffPoll(handoff, origin);
  let settled = false;

  let resolveExternal: (v: { token: string; via: 'dialog' | 'handoff' }) => void;
  const externalPromise = new Promise<{ token: string; via: 'dialog' | 'handoff' }>(
    (resolve) => {
      resolveExternal = resolve;
    }
  );

  let authDialog: { close: () => void };

  authDialog = openAuthDialog(loginUrl, {
    onHandoffReady: () => {
      handoffPoll.wake();
      void (async () => {
        const token = await handoffPoll.pollNow();
        if (token && !settled) {
          settled = true;
          resolveExternal({ token, via: 'handoff' });
          authDialog.close();
        }
      })();
    },
    onDialogMessage: (payload) => {
      const token = tokenFromDialogPayload(payload);
      if (token && !settled) {
        settled = true;
        resolveExternal({ token, via: 'dialog' });
        authDialog.close();
      }
    },
  });

  const handoffTask = handoffPoll.promise.then((token) => {
    if (!settled) settled = true;
    return { token, via: 'handoff' as const };
  });

  const result = await Promise.race([handoffTask, externalPromise]);
  return { ...result, authDialog };
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

    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'useAuth:signIn',message:'start',data:{origin,handoff,taskpaneOrigin:typeof window!=='undefined'?window.location?.origin:null,misconfigured:isMisconfiguredAuthOrigin()},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    if (isMisconfiguredAuthOrigin()) {
      setError(
        'Add-in is not configured for sign-in. Rebuild with VITE_API_URL=https://www.silkview.org and redeploy the add-in on Vercel.'
      );
      setLoading(false);
      return;
    }

    let authDialog: { close: () => void } | null = null;

    try {
      const acquired = await acquireExcelSessionToken(loginUrl, handoff, origin);
      authDialog = acquired.authDialog;
      const { token, via } = acquired;

      setAccessToken(token);
      setSignedIn(true);

      const verifyRes = await fetch(`${origin}/api/onboarding/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const verifyJson = await verifyRes.json().catch(() => null);
      if (verifyJson?.error?.code === 'AUTH_REQUIRED') {
        throw new Error(
          'Sign-in token was rejected by the server. Try signing in again.'
        );
      }

      await auditDialogAuth({
        location: 'useAuth:signIn',
        message: 'success',
        data: { via },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed.';
      await auditDialogAuth({
        location: 'useAuth:signIn',
        message: 'error',
        data: { msg },
      });
      setError(
        msg.includes('cancelled') || msg.includes('timed out')
          ? msg
          : `${msg} Complete MFA if prompted, wait for “Signed in to Excel”, then return to the task pane.`
      );
    } finally {
      authDialog?.close();
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
