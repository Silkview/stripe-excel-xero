import axios from 'axios';
import type { ApiResponse } from '@stripesync/shared';
import { getAccessToken, getWorkspaceId } from './session';

const apiBase =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  '';

export const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
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
    throw err;
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
    throw err;
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
    throw err;
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
  return apiBase || 'http://localhost:4003';
}
