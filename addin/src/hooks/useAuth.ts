import { useState, useCallback } from 'react';
import {
  getAccessToken,
  setAccessToken,
  clearSession,
} from '../utils/session';
import { openAuthDialog } from '../utils/dialogAuth';
import { getOfficeAuthOrigin } from '../utils/officeAuthUrl';

const HANDOFF_TIMEOUT_MS = 90_000;
const HANDOFF_POLL_MS = 800;

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

type HandoffPollResult =
  | { ok: true; token: string }
  | { ok: false; status: number; ready: boolean };

async function fetchHandoffToken(
  handoff: string,
  origin: string
): Promise<HandoffPollResult> {
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
      return { ok: true, token: data.data.accessToken };
    }
    return {
      ok: false,
      status: res.status,
      ready: Boolean(data?.data?.ready),
    };
  } catch {
    return { ok: false, status: 0, ready: false };
  }
}

type HandoffPoller = {
  promise: Promise<string>;
  wake: () => void;
};

function startExcelHandoffPoll(
  handoff: string,
  maxMs = HANDOFF_TIMEOUT_MS,
  intervalMs = HANDOFF_POLL_MS
): HandoffPoller {
  const origin = getOfficeAuthOrigin();
  let lastPoll: HandoffPollResult = { ok: false, status: 0, ready: false };
  let cancelWait: (() => void) | null = null;

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
            lastStatus: lastPoll.ok ? 200 : lastPoll.status,
            lastReady: lastPoll.ok ? true : lastPoll.ready,
          },
        });
        reject(
          new Error(
            'Sign-in timed out. Wait for “Signed in to Excel” in the dialog, then try again.'
          )
        );
        return;
      }

      const result = await fetchHandoffToken(handoff, origin);
      lastPoll = result;
      if (result.ok) {
        resolve(result.token);
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
  };
}

/**
 * Excel sign-in: race server handoff (reliable) vs messageParent (fast when it works).
 */
async function acquireExcelSessionToken(
  loginUrl: string,
  handoff: string
): Promise<{ token: string; via: 'dialog' | 'handoff'; authDialog: { close: () => void } }> {
  const handoffPoll = startExcelHandoffPoll(handoff);

  const authDialog = openAuthDialog(loginUrl, {
    onHandoffReady: () => handoffPoll.wake(),
  });

  const handoffTask = handoffPoll.promise.then((token) => ({
    token,
    via: 'handoff' as const,
  }));

  const dialogTask = authDialog.closed.then((payload) => {
    const token = tokenFromDialogPayload(payload);
    if (token) return { token, via: 'dialog' as const };
    throw new Error('Dialog closed without a session token.');
  });

  const result = await Promise.race([handoffTask, dialogTask]);
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

    let authDialog: { close: () => void } | null = null;

    try {
      const acquired = await acquireExcelSessionToken(loginUrl, handoff);
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
