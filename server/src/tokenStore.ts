export interface StripeTokens {
  access_token: string;
  stripe_user_id: string;
}

export interface XeroTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  tenantId: string;
  tenantName: string;
  /** ISO 4217 org base currency (uppercase), from Xero Organisation API */
  baseCurrency?: string;
}

export interface SessionTokens {
  stripe?: StripeTokens;
  xero?: XeroTokens;
}

const store = new Map<string, SessionTokens>();
const pkceVerifiers = new Map<string, string>();

export const tokenStore = {
  get(sessionId: string): SessionTokens | undefined {
    return store.get(sessionId);
  },

  set(sessionId: string, tokens: SessionTokens): void {
    const existing = store.get(sessionId) ?? {};
    store.set(sessionId, { ...existing, ...tokens });
  },

  setStripe(sessionId: string, stripe: StripeTokens): void {
    const existing = store.get(sessionId) ?? {};
    store.set(sessionId, { ...existing, stripe });
  },

  setXero(sessionId: string, xero: XeroTokens): void {
    const existing = store.get(sessionId) ?? {};
    store.set(sessionId, { ...existing, xero });
  },

  getStripe(sessionId: string): StripeTokens | undefined {
    return store.get(sessionId)?.stripe;
  },

  getXero(sessionId: string): XeroTokens | undefined {
    return store.get(sessionId)?.xero;
  },

  setPkceVerifier(sessionId: string, verifier: string): void {
    pkceVerifiers.set(sessionId, verifier);
  },

  getPkceVerifier(sessionId: string): string | undefined {
    return pkceVerifiers.get(sessionId);
  },

  deletePkceVerifier(sessionId: string): void {
    pkceVerifiers.delete(sessionId);
  },
};
