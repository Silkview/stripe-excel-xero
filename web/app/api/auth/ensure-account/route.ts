import { ensureAccountForUser } from '@/lib/auth/ensure-account';
import { requireUser, ApiAuthError } from '@/lib/api-auth';
import { jsonError, jsonSuccess } from '@/lib/api-response';

export async function POST(req: Request) {
  try {
    const { user } = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const accountName =
      typeof body.accountName === 'string'
        ? body.accountName
        : (user.user_metadata?.account_name as string | undefined);

    const result = await ensureAccountForUser(
      user.id,
      user.email ?? '',
      accountName
    );

    return jsonSuccess(result);
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return jsonError(err.code, err.message, err.status);
    }
    const message = err instanceof Error ? err.message : 'Failed to provision account.';
    return jsonError('PROVISION_ERROR', message, 500);
  }
}
