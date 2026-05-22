import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const pkceStore = new Map<string, string>();

export interface OAuthStatePayload {
  workspaceId: string;
  userId: string;
  nonce: string;
}

function secret(): string {
  const s = process.env.OAUTH_STATE_SECRET;
  if (!s) throw new Error('OAUTH_STATE_SECRET is not configured.');
  return s;
}

export function signOAuthState(payload: OAuthStatePayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyOAuthState(state: string): OAuthStatePayload | null {
  const [body, sig] = state.split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', secret()).update(body).digest('base64url');
  try {
    if (
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
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
