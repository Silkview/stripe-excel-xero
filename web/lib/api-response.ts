import { NextResponse } from 'next/server';
import type { ApiError, ApiResponse } from '@stripesync/shared';

export const REQUEST_TIMEOUT_MS = 15000;

export function jsonSuccess<T>(data: T, status = 200) {
  const body: ApiResponse<T> = { success: true, data };
  return NextResponse.json(body, { status });
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  extra?: Partial<ApiError>
) {
  const body: ApiResponse = {
    success: false,
    error: { code, message, ...extra },
  };
  return NextResponse.json(body, { status });
}

export function authCallbackHtml(payload: object): string {
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  const isSuccess =
    typeof payload === 'object' &&
    payload !== null &&
    'status' in payload &&
    String((payload as { status: string }).status).includes('connected');
  const title = isSuccess ? 'Silkview Sync connected' : 'Connection issue';
  const message = isSuccess
    ? 'You can close this tab and return to Excel.'
    : 'Please close this tab and try again from the add-in.';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>${title}</h1>
<p>${message}</p>
<script>
  Office.onReady(function() {
    try {
      if (Office.context && Office.context.ui && Office.context.ui.messageParent) {
        Office.context.ui.messageParent(${json});
      }
    } catch (e) { }
  });
</script>
</body>
</html>`;
}

export function authCallbackErrorHtml(provider: string, message: string): string {
  return authCallbackHtml({ status: 'error', provider, message });
}
