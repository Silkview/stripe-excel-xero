import { requireUser } from '@/lib/api-auth';
import { getOnboardingStatusForUser } from '@/lib/auth/onboarding-status';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const status = await getOnboardingStatusForUser(
      user.id,
      user.user_metadata as Record<string, unknown>
    );
    return ok(request, status);
  } catch (err) {
    return handleRouteError(request, err);
  }
}
