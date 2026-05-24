import { requireWorkspaceWithXero } from '@/lib/api-auth';
import { getAccounts } from '@/lib/services/xero';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspaceWithXero(request);
    const accounts = await getAccounts(workspaceId);
    return ok(request, accounts);
  } catch (err) {
    return handleRouteError(request, err);
  }
}
