import { appendFileSync } from 'fs';
import { requireWorkspace } from '@/lib/api-auth';
import { getMappingOptions, XeroServiceError } from '@/lib/services/xero';
import { getXeroConnectionMeta } from '@/lib/connections/store';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

const DEBUG_LOG = '/Users/ruvanfernando/stripe-excel-xero/.cursor/debug-4702f2.log';

function debugLog(payload: Record<string, unknown>) {
  try {
    appendFileSync(
      DEBUG_LOG,
      `${JSON.stringify({ sessionId: '4702f2', timestamp: Date.now(), ...payload })}\n`
    );
  } catch {
    // ignore
  }
}

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const meta = await getXeroConnectionMeta(workspaceId);
    debugLog({
      location: 'mapping-options/route.ts:GET:before',
      message: 'mapping-options start',
      hypothesisId: 'B,C',
      data: {
        workspaceId,
        metaStatus: meta.status,
        refreshErrorCode: meta.refreshErrorCode,
      },
    });
    const options = await getMappingOptions(workspaceId);
    debugLog({
      location: 'mapping-options/route.ts:GET:success',
      message: 'mapping-options ok',
      hypothesisId: 'B,C',
      data: { workspaceId, accountCount: options.accounts?.length ?? 0 },
    });
    return ok(request, options);
  } catch (err) {
    debugLog({
      location: 'mapping-options/route.ts:GET:error',
      message: 'mapping-options failed',
      hypothesisId: 'B,C',
      data: {
        code: err instanceof XeroServiceError ? err.code : 'unknown',
        errMessage:
          err instanceof Error ? err.message.slice(0, 160) : String(err),
      },
    });
    return handleRouteError(request, err);
  }
}
