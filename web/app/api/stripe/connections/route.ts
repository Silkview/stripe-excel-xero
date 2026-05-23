import { requireWorkspace, getAccountMembership } from '@/lib/api-auth';
import {
  listStripeConnections,
  listStripeConnectionsForAccount,
  disconnectStripeForWorkspace,
} from '@/lib/connections/store';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { user, workspaceId } = await requireWorkspace(request);
    const membership = await getAccountMembership(user.id);
    if (!membership) {
      return withCors(
        request,
        jsonError('ACCOUNT_REQUIRED', 'No account.', 403)
      );
    }

    const connections = await listStripeConnections(workspaceId);
    const accountWide = await listStripeConnectionsForAccount(
      membership.account_id
    );

    return ok(request, {
      connections: connections.map((c) => ({
        id: c.id,
        stripeAccountId: c.stripe_account_id,
        displayName: c.display_name,
        workspaceId: c.workspace_id,
      })),
      accountStripeCount: accountWide.length,
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}

export async function DELETE(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    await disconnectStripeForWorkspace(workspaceId);
    return ok(request, { disconnected: true });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
