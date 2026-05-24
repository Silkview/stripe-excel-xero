import axios from 'axios';
import {
  clearXeroRefreshFailure,
  getXeroConnection,
  markXeroRefreshFailure,
  saveXeroConnection,
  type XeroTokens,
} from './connections/store';
import { REQUEST_TIMEOUT_MS } from './api-response';
import { XERO_OAUTH_SCOPES } from './xero-scopes';

const XERO_IDENTITY = 'https://identity.xero.com/connect/token';

/** Refresh if within 5 minutes of expiry (do not wait until token is fully expired). */
export const REFRESH_BUFFER_MS = 5 * 60 * 1000;

const XERO_CONNECT_SCOPES = [...XERO_OAUTH_SCOPES];

export class XeroAuthRequiredError extends Error {
  readonly code = 'XERO_AUTH_REQUIRED';

  constructor(message = 'Xero is not connected. Please connect your Xero account.') {
    super(message);
    this.name = 'XeroAuthRequiredError';
  }
}

export type XeroClient = {
  tokens: XeroTokens;
  tenantId: string;
  headers: Record<string, string>;
};

/**
 * In-memory refresh locks keyed by workspaceId.
 *
 * When Excel (or the dashboard) fires several API calls at once, each would
 * otherwise POST to Xero's token endpoint with the same refresh token. Xero
 * rotates refresh tokens strictly — a second concurrent refresh invalidates
 * the first chain and forces reconnect.
 *
 * Pattern: the first caller creates a Promise and stores it in this Map;
 * every other caller for the same workspaceId awaits that same Promise
 * instead of starting another refresh. The entry is removed in `finally` so
 * a later expiry can refresh again.
 *
 * Node.js runs one synchronous block at a time between awaits, so
 * check-then-set on this Map is safe for concurrent async callers.
 */
const refreshLocks = new Map<string, Promise<XeroTokens>>();

function needsRefresh(expiresAtMs: number): boolean {
  return Date.now() >= expiresAtMs - REFRESH_BUFFER_MS;
}

function buildHeaders(tokens: XeroTokens): Record<string, string> {
  return {
    Authorization: `Bearer ${tokens.access_token}`,
    'Xero-tenant-id': tokens.tenantId,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

function toClient(tokens: XeroTokens): XeroClient {
  return {
    tokens,
    tenantId: tokens.tenantId,
    headers: buildHeaders(tokens),
  };
}

function parseXeroTokenError(err: unknown): {
  code: string;
  permanent: boolean;
} {
  if (axios.isAxiosError(err) && err.response?.data) {
    const body = err.response.data as {
      error?: string;
      error_description?: string;
    };
    const code = body.error ?? 'unknown';
    const permanent =
      code === 'invalid_grant' ||
      code === 'invalid_client' ||
      code === 'unauthorized_client';
    return { code, permanent };
  }
  if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
    return { code: 'timeout', permanent: false };
  }
  return { code: 'network', permanent: false };
}

async function postRefreshToken(xero: XeroTokens): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await axios.post(
    XERO_IDENTITY,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.XERO_CLIENT_ID || '',
      client_secret: process.env.XERO_CLIENT_SECRET || '',
      refresh_token: xero.refresh_token,
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: REQUEST_TIMEOUT_MS,
    }
  );
  return response.data;
}

async function performRefresh(
  workspaceId: string,
  xero: XeroTokens
): Promise<XeroTokens> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await postRefreshToken(xero);
      const updated: XeroTokens = {
        ...xero,
        access_token: data.access_token,
        refresh_token: data.refresh_token || xero.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
      await saveXeroConnection(workspaceId, updated, undefined, {
        scopes: xero.scopes ?? XERO_CONNECT_SCOPES,
      });
      await clearXeroRefreshFailure(workspaceId);
      return updated;
    } catch (err) {
      const { code, permanent } = parseXeroTokenError(err);
      console.error(
        '[xero-token-refresh]',
        JSON.stringify({
          workspaceId,
          attempt,
          error: code,
          permanent,
        })
      );
      if (permanent || attempt === 1) {
        if (permanent) {
          await markXeroRefreshFailure(workspaceId, code);
        }
        throw new XeroAuthRequiredError(
          permanent
            ? 'Your Xero connection has expired. Please reconnect.'
            : 'Could not refresh Xero connection. Please try again or reconnect.'
        );
      }
    }
  }

  throw new XeroAuthRequiredError(
    'Your Xero connection has expired. Please reconnect.'
  );
}

async function refreshTokensWithLock(
  workspaceId: string,
  current: XeroTokens
): Promise<XeroTokens> {
  const inflight = refreshLocks.get(workspaceId);
  if (inflight) return inflight;

  const refreshPromise = performRefresh(workspaceId, current).finally(() => {
    refreshLocks.delete(workspaceId);
  });
  refreshLocks.set(workspaceId, refreshPromise);
  return refreshPromise;
}

/**
 * Returns an authenticated Xero client for the workspace.
 * Loads tokens from DB (access_token, refresh_token, expires_at, tenant_id),
 * refreshes when within REFRESH_BUFFER_MS of expiry, and deduplicates refresh
 * requests per workspace.
 */
export async function getXeroClient(workspaceId: string): Promise<XeroClient> {
  const xero = await getXeroConnection(workspaceId);
  if (!xero) {
    throw new XeroAuthRequiredError();
  }

  if (!needsRefresh(xero.expires_at)) {
    return toClient(xero);
  }

  const refreshed = await refreshTokensWithLock(workspaceId, xero);
  return toClient(refreshed);
}

/** Back-compat: returns token bundle only (used by xero.ts service helpers). */
export async function ensureValidToken(workspaceId: string): Promise<XeroTokens> {
  const client = await getXeroClient(workspaceId);
  return client.tokens;
}
