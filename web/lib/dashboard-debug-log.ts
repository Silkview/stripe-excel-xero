import { appendFileSync } from 'fs';

const DEBUG_LOG =
  '/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-4702f2.log';

export function dashboardDebugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
): void {
  const payload = {
    sessionId: '4702f2',
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };
  // #region agent log
  try {
    appendFileSync(DEBUG_LOG, `${JSON.stringify(payload)}\n`);
  } catch {
    /* ignore */
  }
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '4702f2',
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}
