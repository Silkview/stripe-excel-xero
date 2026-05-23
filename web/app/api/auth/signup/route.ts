import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { jsonError, jsonSuccess } from '@/lib/api-response';

/** Auth.users INSERT webhook — only auto-confirms email; provisioning happens in onboarding. */
export async function POST(req: Request) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonError('FORBIDDEN', 'Invalid webhook secret.', 403);
  }

  const { userId } = await req.json();
  if (!userId) {
    return jsonError('VALIDATION_ERROR', 'userId is required.', 400);
  }

  try {
    if (process.env.SUPABASE_AUTO_CONFIRM_EMAIL === 'true') {
      const admin = createSupabaseAdmin();
      await admin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
    }

    return jsonSuccess({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook failed.';
    return jsonError('DB_ERROR', message, 500);
  }
}
