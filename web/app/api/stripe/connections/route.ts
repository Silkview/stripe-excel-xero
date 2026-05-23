import { requireWorkspace, getAccountMembership } from '@/lib/api-auth';
import { listStripeConnections } from '@/lib/connections/store';
import { countAccountStripeConnections } from '@/lib/auth/onboarding-status';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { user, workspaceId } = await requireWorkspace(request);
    const connections = await listStripeConnections(workspaceId);
    const membership = await getAccountMembership(user.id);
    const accountStripeCount = membership
      ? await countAccountStripeConnections(membership.account_id)
      : connections.length;

    return ok(request, {
      connections: connections.map((c) => ({
        id: c.id,
        stripe_account_id: c.stripe_account_id,
        display_name: c.display_name ?? c.stripe_account_id,
      })),
      accountStripeCount,
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
