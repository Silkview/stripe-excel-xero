import { requireWorkspace } from '@/lib/api-auth';
import {
  getStripeConnection,
  listStripeConnections,
} from '@/lib/connections/store';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const connections = await listStripeConnections(workspaceId);
    const defaultRow =
      connections.find((c) => c.is_default) ?? connections[0];
    const stripe = await getStripeConnection(
      workspaceId,
      defaultRow?.stripe_account_id
    );

    return ok(request, {
      connected: connections.length > 0,
      stripe_user_id: stripe?.stripe_user_id,
      defaultStripeAccountId: defaultRow?.stripe_account_id,
      connections: connections.map((c) => ({
        id: c.id,
        stripeAccountId: c.stripe_account_id,
        displayName: c.display_name,
        isDefault: c.is_default ?? false,
      })),
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
