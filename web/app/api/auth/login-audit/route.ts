import { NextResponse } from 'next/server';
import { appendFile } from 'fs/promises';

const LOG_PATH =
  '/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-49b4e5.log';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await request.json().catch(() => ({}));
    await appendFile(
      LOG_PATH,
      `${JSON.stringify({ sessionId: '49b4e5', ...body, timestamp: Date.now() })}\n`
    );
  } catch {
    // Non-fatal
  }
  return NextResponse.json({ ok: true });
}
