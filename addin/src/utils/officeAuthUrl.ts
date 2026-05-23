/** Origin for Office auth dialog (`/auth/excel`). Prefer web API URL in production. */
export function getOfficeAuthOrigin(): string {
  const fromEnv =
    (import.meta.env.VITE_OFFICE_AUTH_ORIGIN as string | undefined)?.replace(
      /\/$/,
      ''
    ) ||
    (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');

  if (fromEnv) {
    warnIfAddinHostUsedAsAuthOrigin(fromEnv);
    return fromEnv;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    warnIfAddinHostUsedAsAuthOrigin(window.location.origin);
    return window.location.origin;
  }

  return 'https://localhost:4000';
}

function warnIfAddinHostUsedAsAuthOrigin(origin: string): void {
  if (typeof console === 'undefined') return;
  const host = origin.replace(/^https?:\/\//, '').toLowerCase();
  const looksLikeAddinOnly =
    host.startsWith('addin.') ||
    host.includes('addin.silkview') ||
    (host.includes('localhost') && !import.meta.env.VITE_API_URL);
  if (looksLikeAddinOnly) {
    console.warn(
      '[Silkview] Auth is pointing at the add-in host (' +
        origin +
        '). Set VITE_API_URL to your web app (e.g. https://www.silkview.org) and rebuild the add-in.'
    );
  }
}
