/** Append Excel handoff nonce across dialog redirects. */
export function withExcelHandoff(path: string, handoff: string | null): string {
  if (!handoff || typeof window === 'undefined') return path;
  const url = new URL(path, window.location.origin);
  url.searchParams.set('handoff', handoff);
  return `${url.pathname}${url.search}`;
}

/** Full navigation for Office dialog auth (client router.push is unreliable). */
export function navigateExcelAuth(path: string, handoff?: string | null): void {
  if (typeof window !== 'undefined') {
    window.location.assign(withExcelHandoff(path, handoff ?? null));
  }
}
