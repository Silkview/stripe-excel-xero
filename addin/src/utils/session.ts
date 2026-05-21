const STORAGE_KEY = 'stripesync_session_id';

let clientSessionId: string | null = null;

export function getClientSessionId(): string | null {
  if (clientSessionId) return clientSessionId;
  try {
    clientSessionId = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    clientSessionId = null;
  }
  return clientSessionId;
}

export function setClientSessionId(id: string): void {
  clientSessionId = id;
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // sessionStorage unavailable in some hosts
  }
}

export function appendSessionId(url: string): string {
  const sid = getClientSessionId();
  if (!sid) return url;
  if (!url.startsWith('/auth') && !url.startsWith('/api')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}sessionId=${encodeURIComponent(sid)}`;
}
