import { verifyXeroTenantPick } from '@/lib/oauth-state';
import { handleOptions, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

/** Returns tenant names for org picker (no tokens). */
export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pick = url.searchParams.get('pick')?.trim();
  if (!pick) {
    return withCors(
      request,
      jsonError('VALIDATION_ERROR', 'Missing pick token.', 400)
    );
  }

  const payload = verifyXeroTenantPick(pick);
  if (!payload) {
    return withCors(
      request,
      jsonError('AUTH_REQUIRED', 'Selection expired. Connect Xero again.', 401)
    );
  }

  return ok(request, {
    tenants: payload.tenants.map((t) => ({
      tenantId: t.tenantId,
      tenantName: t.tenantName,
    })),
  });
}
