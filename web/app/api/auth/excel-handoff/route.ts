import { NextResponse } from 'next/server';
import {
  saveExcelAuthHandoff,
  peekExcelAuthHandoff,
  takeExcelAuthHandoff,
} from '@/lib/auth/excel-handoff';
import { jsonError, jsonSuccess } from '@/lib/api-response';
import { withCors, withPublicHandoffCors, publicHandoffOptions } from '@/lib/cors';

export async function OPTIONS() {
  return publicHandoffOptions();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nonce = url.searchParams.get('nonce')?.trim();
  if (!nonce) {
    return withPublicHandoffCors(
      jsonError('INVALID_REQUEST', 'Missing handoff nonce.', 400)
    );
  }

  const peeked = await peekExcelAuthHandoff(nonce);
  if (!peeked) {
    return withPublicHandoffCors(jsonSuccess({ ready: false }));
  }

  const token = await takeExcelAuthHandoff(nonce);
  if (!token) {
    return withPublicHandoffCors(jsonSuccess({ ready: false }));
  }

  return withPublicHandoffCors(
    jsonSuccess({ ready: true, accessToken: token })
  );
}

export async function POST(request: Request) {
  // #region agent log
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'aa61bb',
    },
    body: JSON.stringify({
      sessionId: 'aa61bb',
      location: 'web/app/api/auth/excel-handoff/route.ts:POST',
      hypothesisId: 'H_EXCEL_T6',
      message: 'handoff-write:entry',
      data: {
        origin: request.headers.get('origin') ?? null,
        referer: request.headers.get('referer') ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  try {
    const body = await request.json().catch(() => ({}));
    const nonce =
      typeof body.nonce === 'string' ? body.nonce.trim() : '';
    const accessToken =
      typeof body.accessToken === 'string' ? body.accessToken.trim() : '';

    if (!nonce || !accessToken) {
      // #region agent log
      fetch(
        'http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'aa61bb',
          },
          body: JSON.stringify({
            sessionId: 'aa61bb',
            location: 'web/app/api/auth/excel-handoff/route.ts:POST',
            hypothesisId: 'H_EXCEL_T6',
            message: 'handoff-write:invalid-body',
            data: { hasNonce: !!nonce, hasToken: !!accessToken },
            timestamp: Date.now(),
          }),
        }
      ).catch(() => {});
      // #endregion
      return withCors(
        request,
        jsonError('INVALID_REQUEST', 'Missing nonce or access token.', 400)
      );
    }

    await saveExcelAuthHandoff(nonce, accessToken);
    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'aa61bb',
      },
      body: JSON.stringify({
        sessionId: 'aa61bb',
        location: 'web/app/api/auth/excel-handoff/route.ts:POST',
        hypothesisId: 'H_EXCEL_T6',
        message: 'handoff-write:saved',
        data: { nonceLen: nonce.length, tokenLen: accessToken.length },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return withCors(request, jsonSuccess({ ok: true }));
  } catch {
    return withCors(
      request,
      jsonError('AUTH_REQUIRED', 'Please sign in.', 401)
    );
  }
}
