/** HTTPS origin for Office displayDialogAsync (taskpane + Vite proxy to Next.js). */
export function getOfficeAuthOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return (
    (import.meta.env.VITE_OFFICE_AUTH_ORIGIN as string | undefined)?.replace(
      /\/$/,
      ''
    ) || 'https://localhost:4000'
  );
}
