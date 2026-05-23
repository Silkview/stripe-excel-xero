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
  // #region agent log
  console.log(
    '[excel-auth-audit]',
    JSON.stringify({
      sessionId: '49b4e5',
      location: 'excel-handoff/GET',
      message: 'peek',
      hypothesisId: 'H2',
      data: { hasPeek: !!peeked, nonceLen: nonce.length },
    })
  );
  // #endregion
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
  try {
    const body = await request.json().catch(() => ({}));
    const nonce =
      typeof body.nonce === 'string' ? body.nonce.trim() : '';
    const accessToken =
      typeof body.accessToken === 'string' ? body.accessToken.trim() : '';

    if (!nonce || !accessToken) {
      return withCors(
        request,
        jsonError('INVALID_REQUEST', 'Missing nonce or access token.', 400)
      );
    }

    await saveExcelAuthHandoff(nonce, accessToken);
    return withCors(request, jsonSuccess({ ok: true }));
  } catch {
    return withCors(
      request,
      jsonError('AUTH_REQUIRED', 'Please sign in.', 401)
    );
  }
}
