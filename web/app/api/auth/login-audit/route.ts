import { NextResponse } from 'next/server';
import { appendFile } from 'fs/promises';

const LOG_PATH =
  '/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-49b4e5.log';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const line = JSON.stringify({
      sessionId: '49b4e5',
      ...body,
      timestamp: Date.now(),
    });
    if (process.env.NODE_ENV !== 'production') {
      await appendFile(LOG_PATH, `${line}\n`);
    } else {
      console.log('[excel-auth-audit]', line);
    }
  } catch {
    // Non-fatal
  }
  return NextResponse.json({ ok: true });
}
