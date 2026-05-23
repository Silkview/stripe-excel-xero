import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const pkceStore = new Map<string, string>();

/** OAuth state validity (authorize → callback). */
export const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

export interface OAuthStatePayload {
  workspaceId: string;
  userId: string;
  nonce: string;
  exp: number;
  /** Xero PKCE verifier (embedded in signed state for system-browser OAuth). */
  codeVerifier?: string;
  /** Stripe Connect: client_id + redirect_uri used when building the authorize URL. */
  stripeClientId?: string;
  stripeRedirectUri?: string;
  /** Stripe Connect OAuth landing: register (new account) or login (existing). */
  stripeConnectFlow?: 'register' | 'login';
}

export interface XeroTenantPickPayload {
  workspaceId: string;
  userId: string;
  exp: number;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  tenants: { tenantId: string; tenantName: string }[];
}

function secret(): string {
  const s = process.env.OAUTH_STATE_SECRET;
  if (!s) throw new Error('OAUTH_STATE_SECRET is not configured.');
  return s;
}

function signPayload(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyPayload<T extends { exp: number }>(token: string): T | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', secret()).update(body).digest('base64url');
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8')
    ) as T;
    if (typeof parsed.exp === 'number' && parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function signOAuthState(
  payload: Omit<OAuthStatePayload, 'exp'> & { exp?: number }
): string {
  return signPayload({
    ...payload,
    exp: payload.exp ?? Date.now() + OAUTH_STATE_TTL_MS,
  });
}

export function verifyOAuthState(state: string): OAuthStatePayload | null {
  const parsed = verifyPayload<OAuthStatePayload>(state);
  if (!parsed?.workspaceId || !parsed.userId) return null;
  return parsed;
}

export function signXeroTenantPick(
  payload: Omit<XeroTenantPickPayload, 'exp'> & { exp?: number }
): string {
  return signPayload({
    ...payload,
    exp: payload.exp ?? Date.now() + OAUTH_STATE_TTL_MS,
  });
}

export function verifyXeroTenantPick(token: string): XeroTenantPickPayload | null {
  const parsed = verifyPayload<XeroTenantPickPayload>(token);
  if (!parsed?.access_token || !parsed.tenants?.length) return null;
  return parsed;
}

export function setPkceVerifier(stateKey: string, verifier: string): void {
  pkceStore.set(stateKey, verifier);
}

export function getPkceVerifier(stateKey: string): string | undefined {
  return pkceStore.get(stateKey);
}

export function deletePkceVerifier(stateKey: string): void {
  pkceStore.delete(stateKey);
}

export function newNonce(): string {
  return randomBytes(16).toString('hex');
}
