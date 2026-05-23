import axios from 'axios';
import type { ApiResponse } from '@stripesync/shared';
import { getApiBase, getOfficeAuthOrigin } from './officeAuthUrl';
import { getAccessToken, getStripeAccountId, getWorkspaceId } from './session';

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
  const stripeAcct = getStripeAccountId();
  if (stripeAcct) {
    config.headers['X-Stripe-Account-Id'] = stripeAcct;
  }
  return config;
});

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
    rethrowApiError(err);
  }
}

/** Pull from a specific Stripe account; query param overrides session header on server. */
export async function apiGetWithStripeAccount<T>(
  url: string,
  stripeAccountId: string
): Promise<ApiResponse<T>> {
  const separator = url.includes('?') ? '&' : '?';
  const fullUrl = `${url}${separator}stripeAccountId=${encodeURIComponent(stripeAccountId)}`;
  try {
    const token = getAccessToken();
    const ws = getWorkspaceId();
    const res = await api.get<ApiResponse<T>>(fullUrl, {
      timeout: 60_000,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(ws ? { 'X-Workspace-Id': ws } : {}),
      },
    });
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      return err.response.data as ApiResponse<T>;
    }
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
