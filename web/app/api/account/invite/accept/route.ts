import { requireUser } from '@/lib/api-auth';
import { acceptInvitation } from '@/lib/dashboard/team';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token : '';

    if (!token) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Invitation token is required.', 400)
      );
    }

    const result = await acceptInvitation(
      user.id,
      user.email ?? '',
      token
    );

    return ok(request, result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Could not accept invitation.';
    return withCors(request, jsonError('INVITE_ERROR', message, 400));
  }
}
