import { requireAccountAdmin } from '@/lib/api-auth';
import { loadBillingStatusForAccount } from '@/lib/billing/load-billing-status';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { membership } = await requireAccountAdmin(request);
    const status = await loadBillingStatusForAccount(membership.account_id);
    return ok(request, status);
  } catch (err) {
    return handleRouteError(request, err);
  }
}
