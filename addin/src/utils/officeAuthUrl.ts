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
