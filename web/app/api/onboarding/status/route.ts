import { requireUser } from '@/lib/api-auth';
import { getOnboardingStatusForUser } from '@/lib/auth/onboarding-status';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const workspaceHeader =
      request.headers.get('x-workspace-id') ||
      request.headers.get('X-Workspace-Id') ||
      null;
    const status = await getOnboardingStatusForUser(
      user.id,
      user.user_metadata as Record<string, unknown>,
      workspaceHeader
    );
    return ok(request, status);
  } catch (err) {
    return handleRouteError(request, err);
  }
}
