import { requireWorkspace } from '@/lib/api-auth';
import { pushManualJournals } from '@/lib/services/xero';
import type { ManualJournalPushRequest } from '@stripesync/shared';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const body = (await request.json()) as ManualJournalPushRequest;
    const status = body?.status;
    const lines = body?.lines;

    if (status !== 'DRAFT' && status !== 'POSTED') {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Status must be DRAFT or POSTED.', 400)
      );
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return withCors(
        request,
        jsonError(
          'VALIDATION_ERROR',
          'No journal lines to push. Build journals in Excel first.',
          400
        )
      );
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line?.date || !line?.accountCode) {
        return withCors(
          request,
          jsonError(
            'VALIDATION_ERROR',
            `Line ${i + 1} is missing date or account code.`,
            400
          )
        );
      }
      if (typeof line.netAmount !== 'number' || line.netAmount === 0) {
        return withCors(
          request,
          jsonError(
            'VALIDATION_ERROR',
            `Line ${i + 1} must have a non-zero gross amount.`,
            400
          )
        );
      }
    }

    const result = await pushManualJournals(workspaceId, status, lines);
    return ok(request, result);
  } catch (err) {
    return handleRouteError(request, err);
  }
}
