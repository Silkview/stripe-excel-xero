/** Full navigation for Office dialog auth (client router.push is unreliable). */
export function navigateExcelAuth(path: string): void {
  if (typeof window !== 'undefined') {
    window.location.assign(path);
  }
}
