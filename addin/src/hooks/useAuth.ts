import { useState, useCallback } from 'react';
import {
  getAccessToken,
  setAccessToken,
  clearSession,
} from '../utils/session';
import { openAuthDialog } from '../utils/dialogAuth';
import { apiGet } from '../utils/api';
import {
  getOfficeAuthOrigin,
  getHandoffPollOrigin,
  isMisconfiguredAuthOrigin,
  verifyHandoffPollReachable,
  verifyTaskpaneApiReachable,
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
  pollOrigin: string,
  maxMs = HANDOFF_TIMEOUT_MS,
  intervalMs = HANDOFF_POLL_MS
): HandoffPoller {
  let lastPoll: HandoffPollResult = { ok: false, status: 0, ready: false };
  let cancelWait: (() => void) | null = null;
  let pollCount = 0;

  const pollNow = async (): Promise<string | null> => {
    const result = await fetchHandoffToken(handoff, pollOrigin);
    lastPoll = result;
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
            pollOrigin,
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
  handoff: string
): Promise<{ token: string; via: 'dialog' | 'handoff'; authDialog: { close: () => void } }> {
  const pollOrigin = getHandoffPollOrigin();
  const handoffPoll = startExcelHandoffPoll(handoff, pollOrigin);
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
        for (let i = 0; i < 12 && !settled; i++) {
          const token = await handoffPoll.pollNow();
          if (token) {
            settled = true;
            resolveExternal({ token, via: 'handoff' });
            authDialog.close();
            return;
          }
          await new Promise((r) => setTimeout(r, 100));
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
    const pollOrigin = getHandoffPollOrigin();
    const loginUrl = `${origin}/auth/excel?handoff=${encodeURIComponent(handoff)}`;

    if (isMisconfiguredAuthOrigin()) {
      setError(
        'Add-in is not configured for sign-in. Rebuild with VITE_API_URL=https://www.silkview.org and redeploy the add-in on Vercel.'
      );
      setLoading(false);
      return;
    }

    const handoffReachable = await verifyHandoffPollReachable();
    if (!handoffReachable.ok) {
      setError(handoffReachable.message ?? 'Sign-in API is not reachable.');
      setLoading(false);
      return;
    }

    const apiReachable = await verifyTaskpaneApiReachable();
    if (!apiReachable.ok) {
      setError(apiReachable.message ?? 'Add-in API is not reachable.');
      setLoading(false);
      return;
    }

    let authDialog: { close: () => void } | null = null;

    try {
      const acquired = await acquireExcelSessionToken(loginUrl, handoff);
      authDialog = acquired.authDialog;
      const { token, via } = acquired;

      setAccessToken(token);

      const verifyRes = await apiGet<{ needsAccountSetup?: boolean }>(
        '/api/onboarding/status'
      );
      if (verifyRes.error?.code === 'AUTH_REQUIRED') {
        clearSession();
        throw new Error(
          'Sign-in token was rejected by the server. Try signing in again.'
        );
      }

      setSignedIn(true);

      await auditDialogAuth({
        location: 'useAuth:signIn',
        message: 'success',
        data: { via },
      });
    } catch (err) {
      clearSession();
      setSignedIn(false);
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
