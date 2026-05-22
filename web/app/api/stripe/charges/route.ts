import { requireWorkspace } from '@/lib/api-auth';
import { handleStripePull } from '@/lib/stripe-pull';
import { getCharges } from '@/lib/services/stripe-data';
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
      getCharges,
      'Failed to fetch charges. Please try again.'
    );
  } catch (err) {
    return handleRouteError(request, err);
  }
}
