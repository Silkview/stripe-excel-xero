import axios from 'axios';
import type { ApiResponse } from '@stripesync/shared';
import { getApiBase, getOfficeAuthOrigin } from './officeAuthUrl';
import { getAccessToken, getWorkspaceId } from './session';

export const api = axios.create({
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBase();
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const ws = getWorkspaceId();
  if (ws) {
    config.headers['X-Workspace-Id'] = ws;
  }
  return config;
});

function logApiNetworkFailure(
  method: string,
  url: string,
  err: unknown
): void {
  if (!axios.isAxiosError(err) || err.message !== 'Network Error') return;
  // #region agent log
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '49b4e5',
    },
    body: JSON.stringify({
      sessionId: '49b4e5',
      location: 'api.ts:network',
      message: 'axios network error',
      data: {
        method,
        url,
        apiBase: getApiBase().replace(/^https?:\/\//, ''),
        taskpaneOrigin:
          typeof window !== 'undefined'
            ? window.location?.origin?.replace(/^https?:\/\//, '')
            : null,
      },
      timestamp: Date.now(),
      hypothesisId: 'H7',
      runId: 'post-fix-v3',
    }),
  }).catch(() => {});
  // #endregion
}

function rethrowApiError(err: unknown): never {
  if (axios.isAxiosError(err) && err.message === 'Network Error') {
    throw new Error(
      'Cannot reach the Silkview API from Excel. Reload the add-in after redeploying, or sign in again.'
    );
  }
  throw err;
}

export async function apiPost<T, B = unknown>(
  url: string,
  body: B
): Promise<ApiResponse<T>> {
  try {
    const res = await api.post<ApiResponse<T>>(url, body);
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      return err.response.data as ApiResponse<T>;
    }
    logApiNetworkFailure('POST', url, err);
    rethrowApiError(err);
  }
}

export async function apiPatch<T, B = unknown>(
  url: string,
  body: B
): Promise<ApiResponse<T>> {
  try {
    const res = await api.patch<ApiResponse<T>>(url, body);
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      return err.response.data as ApiResponse<T>;
    }
    logApiNetworkFailure('PATCH', url, err);
    rethrowApiError(err);
  }
}

export async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const res = await api.get<ApiResponse<T>>(url);
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      return err.response.data as ApiResponse<T>;
    }
    logApiNetworkFailure('GET', url, err);
    rethrowApiError(err);
  }
}

export function getApiErrorMessage(
  response: ApiResponse,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (response.error?.message) {
    return response.error.message;
  }
  return fallback;
}

export function getAppUrl(): string {
  return getOfficeAuthOrigin() || 'http://localhost:4003';
}
