import { requireWorkspace } from '@/lib/api-auth';
import { handleStripePull } from '@/lib/stripe-pull';
import { getPayouts } from '@/lib/services/stripe-data';
import { handleOptions, handleRouteError } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    return handleStripePull(
      request,
      workspaceId,
      getPayouts,
      'Failed to fetch payouts. Please try again.'
    );
  } catch (err) {
    return handleRouteError(request, err);
  }
}
