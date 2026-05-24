import fs from 'fs';

const DEBUG_LOG_PATH =
  process.env.DEBUG_LOG_PATH ??
  '/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-4702f2.log';

/** Append one NDJSON debug line (agent debug session). */
export function appendDebugLog(payload: Record<string, unknown>): void {
  try {
    fs.appendFileSync(
      DEBUG_LOG_PATH,
      `${JSON.stringify({ ...payload, timestamp: Date.now() })}\n`
    );
  } catch {
    // ignore logging failures
  }
}
