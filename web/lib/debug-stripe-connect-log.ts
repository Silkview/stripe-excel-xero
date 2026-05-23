import { appendFileSync } from 'fs';

const LOG_PATH =
  '/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-4702f2.log';

type DebugPayload = {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
};

/** Debug-mode logging for Stripe Connect OAuth (no secrets). */
export function debugStripeConnectLog(payload: DebugPayload): void {
  const line = JSON.stringify({
    sessionId: '4702f2',
    timestamp: Date.now(),
    ...payload,
  });

  try {
    appendFileSync(LOG_PATH, `${line}\n`);
  } catch {
    // ignore if log path unavailable (e.g. serverless)
  }

  console.error('[stripe-connect-debug]', line);

  // #region agent log
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '4702f2',
    },
    body: JSON.stringify({
      sessionId: '4702f2',
      timestamp: Date.now(),
      ...payload,
    }),
  }).catch(() => {});
  // #endregion
}
