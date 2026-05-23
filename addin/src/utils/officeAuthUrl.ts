const WEB_APP_ORIGIN = 'https://www.silkview.org';

/** Origin for Office auth dialog (`/auth/excel`). Prefer web API URL in production. */
export function getOfficeAuthOrigin(): string {
  const fromEnv =
    (import.meta.env.VITE_OFFICE_AUTH_ORIGIN as string | undefined)?.replace(
      /\/$/,
      ''
    ) ||
    (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');

  if (fromEnv) {
    return fromEnv;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (isAddinOnlyHost(origin)) {
      // Production add-in builds must set VITE_API_URL; fall back to known web host.
      return WEB_APP_ORIGIN;
    }
    return origin;
  }

  return 'https://localhost:4000';
}

function isAddinOnlyHost(origin: string): boolean {
  const host = origin.replace(/^https?:\/\//, '').toLowerCase();
  return (
    host.startsWith('addin.') ||
    host.includes('addin.silkview') ||
    (host.includes('localhost:4000') && !import.meta.env.VITE_API_URL)
  );
}

/** True when auth APIs would be called on the add-in host (no web app). */
export function isMisconfiguredAuthOrigin(): boolean {
  return isAddinOnlyHost(getOfficeAuthOrigin());
}

/**
 * Axios base URL for authenticated API calls from the task pane.
 * Same-origin via add-in /api/* proxy — Excel WebView often blocks cross-origin XHR to www.
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
    /\/$/,
    ''
  );
  return fromEnv || '';
}

/**
 * Poll excel-handoff from the task-pane origin (same-origin via addin vercel rewrite).
 * Excel often blocks cross-origin fetch from the task pane to www even when CORS allows it.
 */
export function getHandoffPollOrigin(): string {
  return getApiBase() || getOfficeAuthOrigin();
}

async function probeJsonApi(path: string): Promise<{
  ok: boolean;
  message?: string;
}> {
  const base = getApiBase();
  if (!base) {
    return { ok: false, message: 'Task pane origin is unknown.' };
  }
  try {
    const res = await fetch(`${base}${path}`);
    const text = await res.text();
    if (res.status === 404 || text.includes('NOT_FOUND')) {
      return {
        ok: false,
        message:
          'Add-in API proxy is not deployed. Redeploy the add-in Vercel project (needs addin/api/), then reload Excel.',
      };
    }
    if (!text.includes('"success"')) {
      return {
        ok: false,
        message: `API at ${base}${path} did not return JSON. Redeploy the add-in project.`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: `Cannot reach API at ${base}. Check network and redeploy the add-in.`,
    };
  }
}

/** Confirms same-origin /api/* proxy works (required after sign-in for onboarding, Stripe, Xero). */
export async function verifyTaskpaneApiReachable(): Promise<{
  ok: boolean;
  message?: string;
}> {
  const onboarding = await probeJsonApi('/api/onboarding/status');
  if (!onboarding.ok) return onboarding;
  return probeJsonApi('/api/stripe/status');
}

/** Confirms add-in can reach handoff API (requires addin/vercel.json proxy on Vercel). */
export async function verifyHandoffPollReachable(): Promise<{
  ok: boolean;
  message?: string;
}> {
  const pollOrigin = getHandoffPollOrigin();
  try {
    const res = await fetch(
      `${pollOrigin}/api/auth/excel-handoff?nonce=00000000-0000-4000-8000-000000000000`
    );
    const text = await res.text();
    if (res.status === 404 || text.includes('NOT_FOUND')) {
      return {
        ok: false,
        message:
          'Add-in API proxy is not deployed. Push latest code and redeploy the add-in Vercel project (needs addin/vercel.json), then reload Excel.',
      };
    }
    if (!text.includes('"success"')) {
      return {
        ok: false,
        message: `Handoff API at ${pollOrigin} did not return JSON. Redeploy the add-in project.`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: `Cannot reach handoff API at ${pollOrigin}. Check network and redeploy the add-in.`,
    };
  }
}
