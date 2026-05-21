import fs from 'fs';

const LOG_PATH =
  '/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-49b4e5.log';

export function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
  runId = 'pre-fix'
): void {
  // #region agent log
  try {
    const line = JSON.stringify({
      sessionId: '49b4e5',
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId,
    });
    fs.appendFileSync(LOG_PATH, `${line}\n`);
  } catch {
    /* ignore */
  }
  // #endregion
}
