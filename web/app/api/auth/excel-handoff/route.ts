import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import {
  saveExcelAuthHandoff,
  takeExcelAuthHandoff,
} from '@/lib/auth/excel-handoff';
import { jsonError, jsonSuccess } from '@/lib/api-response';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nonce = url.searchParams.get('nonce')?.trim();
  if (!nonce) {
    return jsonError('INVALID_REQUEST', 'Missing handoff nonce.', 400);
  }

  const token = await takeExcelAuthHandoff(nonce);
  if (!token) {
    return jsonSuccess({ ready: false });
  }

  return jsonSuccess({ ready: true, accessToken: token });
}

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const nonce =
      typeof body.nonce === 'string' ? body.nonce.trim() : '';
    const accessToken =
      typeof body.accessToken === 'string' ? body.accessToken.trim() : '';

    if (!nonce || !accessToken) {
      return jsonError('INVALID_REQUEST', 'Missing nonce or access token.', 400);
    }

    await saveExcelAuthHandoff(nonce, accessToken);
    return jsonSuccess({ ok: true });
  } catch {
    return jsonError('AUTH_REQUIRED', 'Please sign in.', 401);
  }
}
