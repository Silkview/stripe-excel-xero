import axios from 'axios';
import type { ApiResponse } from '@stripesync/shared';
import { appendSessionId } from './session';

export const api = axios.create({
  baseURL: '',
  withCredentials: true,
  timeout: 20000,
});

export async function apiPost<T, B = unknown>(
  url: string,
  body: B
): Promise<ApiResponse<T>> {
  const requestUrl = appendSessionId(url);
  try {
    const res = await api.post<ApiResponse<T>>(requestUrl, body);
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      return err.response.data as ApiResponse<T>;
    }
    throw err;
  }
}

export async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  const requestUrl = appendSessionId(url);
  try {
    const res = await api.get<ApiResponse<T>>(requestUrl);
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
