import { getInvitePreviewByToken } from '@/lib/dashboard/invite-preview';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token')?.trim() ?? '';

    if (!token) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Invitation token is required.', 400)
      );
    }

    const preview = await getInvitePreviewByToken(token);
    if (!preview) {
      return withCors(
        request,
        jsonError(
          'INVITE_INVALID',
          'Invitation is invalid, expired, or already used.',
          404
        )
      );
    }

    return ok(request, preview);
  } catch (err) {
    return handleRouteError(request, err);
  }
}
