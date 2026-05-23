/** Best-effort launch Microsoft Excel from the browser. */
export function tryOpenExcel(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.location.href = 'ms-excel:';
    return true;
  } catch {
    return false;
  }
}

export function getAddinManifestUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_ADDIN_URL?.replace(/\/$/, '') ??
    'https://localhost:4000';
  return `${base}/manifest.xml`;
}

export function getExcelSignInUrl(appUrl: string): string {
  const base = appUrl.replace(/\/$/, '');
  return `${base}/auth/login?return=excel`;
}
