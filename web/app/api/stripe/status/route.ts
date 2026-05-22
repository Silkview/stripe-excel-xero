import { requireWorkspace } from '@/lib/api-auth';
import { getStripeConnection } from '@/lib/connections/store';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const stripe = await getStripeConnection(workspaceId);
    return ok(request, {
      connected: !!stripe,
      stripe_user_id: stripe?.stripe_user_id,
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
