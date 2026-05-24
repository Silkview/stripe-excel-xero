import { appendDebugLog } from '@/lib/debug-log';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    appendDebugLog({
      sessionId: '4702f2',
      ...body,
    });
    return ok(request, { logged: true });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
