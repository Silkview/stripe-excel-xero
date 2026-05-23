import { listPlans } from '@/lib/plans/catalog';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const plans = await listPlans();
    return ok(request, { plans });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
