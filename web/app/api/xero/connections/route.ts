import { requireWorkspace } from '@/lib/api-auth';
import { ensureXeroBaseCurrency } from '@/lib/services/xero';
import { getXeroConnection } from '@/lib/connections/store';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';
import { XeroServiceError } from '@/lib/services/xero';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const xero = await getXeroConnection(workspaceId);
    if (!xero) {
      return ok(request, { connected: false });
    }
    try {
      const baseCurrency = await ensureXeroBaseCurrency(workspaceId);
      const updated = await getXeroConnection(workspaceId);
      return ok(request, {
        connected: true,
        tenantName: updated?.tenantName,
        tenantId: updated?.tenantId,
        baseCurrency,
      });
    } catch (err) {
      if (err instanceof XeroServiceError) {
        return withCors(request, jsonError(err.code, err.message, 502));
      }
      return withCors(
        request,
        jsonError('XERO_ERROR', 'Failed to load Xero connection.', 502)
      );
    }
  } catch (err) {
    return handleRouteError(request, err);
  }
}
