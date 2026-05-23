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
  const errorMessage =
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof (payload as { message: unknown }).message === 'string'
      ? (payload as { message: string }).message
      : null;
  const title = isSuccess ? 'Silkview Sync connected' : 'Stripe not connected';
  const message = isSuccess
    ? 'You can close this tab and return to Excel.'
    : errorMessage ??
      'Please close this tab and try again from the add-in.';
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

/** Office dialog page that returns the Supabase access token to the Excel task pane. */
export function authExcelSignInHtml(
  accessToken: string,
  handoffNonce?: string | null
): string {
  const handoffJson = JSON.stringify(handoffNonce ?? '').replace(/</g, '\\u003c');
  const signedInJson = JSON.stringify({ status: 'signed_in', accessToken }).replace(
    /</g,
    '\\u003c'
  );
  const handoffReadyJson = JSON.stringify({ status: 'handoff_ready' }).replace(
    /</g,
    '\\u003c'
  );
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>Signed in to Excel</h1>
<p id="status">Returning to Excel…</p>
<script>
  Office.onReady(function() {
    var signedInPayload = ${signedInJson};
    var handoffReadyPayload = ${handoffReadyJson};
    var handoffNonce = ${handoffJson};
    var attempts = 0;
    function persistHandoffThen(cb) {
      if (!handoffNonce) { cb(); return; }
      fetch('/api/auth/excel-handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nonce: handoffNonce, accessToken: signedInPayload.accessToken })
      }).finally(cb);
    }
    function sendToParent(payload) {
      try {
        if (Office.context && Office.context.ui && Office.context.ui.messageParent) {
          Office.context.ui.messageParent(payload);
          return true;
        }
      } catch (e) { }
      return false;
    }
    function retry() {
      persistHandoffThen(function() {
        sendToParent(signedInPayload);
        sendToParent(handoffReadyPayload);
        var el = document.getElementById('status');
        if (el) el.textContent = 'Returning to Excel…';
        attempts += 1;
        if (attempts < 25) setTimeout(retry, 200);
      });
    }
    retry();
  });
</script>
</body>
</html>`;
}

export function authExcelSignInErrorHtml(message: string): string {
  const json = JSON.stringify({ status: 'error', message }).replace(
    /</g,
    '\\u003c'
  );
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Silkview Sync</title>
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" type="text/javascript"></script>
  <style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto;}</style>
</head>
<body>
<h1>Sign-in failed</h1>
<p>${message.replace(/</g, '&lt;')}</p>
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
