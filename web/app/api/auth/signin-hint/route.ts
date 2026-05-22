import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { lookupAuthUserByEmail } from '@/lib/auth/signin-hint';
import { jsonError, jsonSuccess } from '@/lib/api-response';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email) {
    return jsonError('VALIDATION_ERROR', 'email is required.', 400);
  }

  try {
    const admin = createSupabaseAdmin();
    const hint = await lookupAuthUserByEmail(admin, email);
    return jsonSuccess(hint);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'hint lookup failed';
    return jsonError('HINT_ERROR', message, 500);
  }
}
