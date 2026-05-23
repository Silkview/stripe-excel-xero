/**
 * Canonical web app origin for OAuth callbacks and auth links.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://www.silkview.org).
 */
export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '');
    return `https://${host}`;
  }

  return 'http://localhost:4003';
}
