import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { listTeamForAccount } from '@/lib/dashboard/team';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request);
    const membership = await getAccountMembership(user.id);
    if (!membership) {
      return withCors(request, jsonError('FORBIDDEN', 'No account.', 403));
    }

    if (membership.role === 'member') {
      return withCors(request, jsonError('FORBIDDEN', 'Admins only.', 403));
    }

    const team = await listTeamForAccount(membership.account_id);
    return ok(request, team);
  } catch (err) {
    return handleRouteError(request, err);
  }
}
