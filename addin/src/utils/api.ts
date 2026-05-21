import axios from 'axios';
import type { ApiResponse } from '@stripesync/shared';
import { appendSessionId } from './session';

export const api = axios.create({
  baseURL: '',
  withCredentials: true,
  timeout: 20000,
});

// #region agent log
api.interceptors.request.use((config) => {
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'api.ts:request',message:'axios request start',data:{url:config.url,baseURL:config.baseURL,pageOrigin:typeof window!=='undefined'?window.location.origin:null,pageProtocol:typeof window!=='undefined'?window.location.protocol:null},timestamp:Date.now(),hypothesisId:'A,C,D'})}).catch(()=>{});
  return config;
});
api.interceptors.response.use(
  (res) => {
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'api.ts:response',message:'axios response ok',data:{url:res.config.url,status:res.status},timestamp:Date.now(),hypothesisId:'B,E'})}).catch(()=>{});
    return res;
  },
  (err) => {
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'api.ts:responseError',message:'axios response error',data:{code:err?.code,message:err?.message,isAxiosError:!!err?.isAxiosError,hasResponse:!!err?.response,responseStatus:err?.response?.status,url:err?.config?.url,baseURL:err?.config?.baseURL},timestamp:Date.now(),hypothesisId:'A,B,C'})}).catch(()=>{});
    return Promise.reject(err);
  }
);
// #endregion

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
      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',runId:'post-fix-2',location:'api.ts:apiGet',message:'parsed error response body',data:{status:err.response.status,code:(err.response.data as ApiResponse)?.error?.code},timestamp:Date.now(),hypothesisId:'F'})}).catch(()=>{});
      // #endregion
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
