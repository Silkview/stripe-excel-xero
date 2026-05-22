import { ensureAccountForUser } from '@/lib/auth/ensure-account';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { jsonError, jsonSuccess } from '@/lib/api-response';

export async function POST(req: Request) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonError('FORBIDDEN', 'Invalid webhook secret.', 403);
  }

  const { userId, email, accountName } = await req.json();
  if (!userId || !email) {
    return jsonError('VALIDATION_ERROR', 'userId and email are required.', 400);
  }

  try {
    if (process.env.SUPABASE_AUTO_CONFIRM_EMAIL === 'true') {
      const admin = createSupabaseAdmin();
      await admin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
    }

    const result = await ensureAccountForUser(userId, email, accountName);
    return jsonSuccess({
      accountId: result.accountId,
      existing: !result.created,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create account.';
    return jsonError('DB_ERROR', message, 500);
  }
}
