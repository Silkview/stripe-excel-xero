import { NextResponse } from 'next/server';
import {
  saveExcelAuthHandoff,
  takeExcelAuthHandoff,
} from '@/lib/auth/excel-handoff';
import { jsonError, jsonSuccess } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return withCors(request, new NextResponse(null, { status: 204 }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nonce = url.searchParams.get('nonce')?.trim();
  if (!nonce) {
    return withCors(
      request,
      jsonError('INVALID_REQUEST', 'Missing handoff nonce.', 400)
    );
  }

  const token = await takeExcelAuthHandoff(nonce);
  if (!token) {
    return withCors(request, jsonSuccess({ ready: false }));
  }

  return withCors(
    request,
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
