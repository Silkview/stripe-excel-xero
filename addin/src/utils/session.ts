const TOKEN_KEY = 'stripesync_access_token';
const WORKSPACE_KEY = 'stripesync_workspace_id';

let accessToken: string | null = null;
let workspaceId: string | null = null;

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  try {
    accessToken = localStorage.getItem(TOKEN_KEY);
  } catch {
    accessToken = null;
  }
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearAccessToken(): void {
  accessToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function getWorkspaceId(): string | null {
  if (workspaceId) return workspaceId;
  try {
    workspaceId = localStorage.getItem(WORKSPACE_KEY);
  } catch {
    workspaceId = null;
  }
  return workspaceId;
}

export function setWorkspaceId(id: string): void {
  workspaceId = id;
  try {
    localStorage.setItem(WORKSPACE_KEY, id);
  } catch {
    // ignore
  }
}

export function clearWorkspaceId(): void {
  workspaceId = null;
  try {
    localStorage.removeItem(WORKSPACE_KEY);
  } catch {
    // ignore
  }
}

/** Clear auth token and workspace selection (sign-out / expired session). */
export function clearSession(): void {
  clearAccessToken();
  clearWorkspaceId();
}
