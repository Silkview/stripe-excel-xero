import { requireWorkspace } from '@/lib/api-auth';
import { getMappingOptions } from '@/lib/services/xero';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const options = await getMappingOptions(workspaceId);
    return ok(request, options);
  } catch (err) {
    return handleRouteError(request, err);
  }
}
