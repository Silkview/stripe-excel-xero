import { createSupabaseServer } from '@/lib/supabase/server';
import { jsonError, jsonSuccess } from '@/lib/api-response';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const accessToken =
    typeof body.access_token === 'string' ? body.access_token : '';
  const refreshToken =
    typeof body.refresh_token === 'string' ? body.refresh_token : '';

  if (!accessToken || !refreshToken) {
    return jsonError(
      'VALIDATION_ERROR',
      'access_token and refresh_token are required.',
      400
    );
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return jsonError('AUTH_ERROR', error.message, 401);
  }

  return jsonSuccess({ ok: true });
}

export async function DELETE() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut().catch(() => {});
  return jsonSuccess({ ok: true });
}
