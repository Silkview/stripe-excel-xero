import { requireUser } from '@/lib/api-auth';
import {
  resolveProvisioningFields,
  tryProvisionFromMetadata,
} from '@/lib/auth/provision-from-metadata';
import type { PlanCode } from '@/lib/plans/types';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

const VALID_PLANS: PlanCode[] = ['free', 'pro', 'firm'];

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request);
    const body = await request.json().catch(() => ({}));

    const overrides: Partial<{
      planCode: PlanCode;
      accountName: string;
      workspaceName: string;
    }> = {};

    if (body.planCode && VALID_PLANS.includes(body.planCode as PlanCode)) {
      overrides.planCode = body.planCode as PlanCode;
    }
    if (typeof body.accountName === 'string' && body.accountName.trim()) {
      overrides.accountName = body.accountName.trim();
    }
    if (typeof body.workspaceName === 'string' && body.workspaceName.trim()) {
      overrides.workspaceName = body.workspaceName.trim();
    }

    const fields = resolveProvisioningFields(user, overrides);

    if (!VALID_PLANS.includes(fields.planCode)) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Invalid plan.', 400)
      );
    }

    const result = await tryProvisionFromMetadata(user, overrides);

    if (!result.provisioned || !result.workspaceId) {
      return withCors(
        request,
        jsonError(
          'PROVISION_ERROR',
          result.error ?? 'Failed to create account.',
          500
        )
      );
    }

    return ok(
      request,
      {
        accountId: result.accountId,
        workspaceId: result.workspaceId,
        created: result.created,
      },
      result.created ? 201 : 200
    );
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message;
      if (
        msg.includes('required') ||
        msg.includes('Unknown plan') ||
        msg.includes('Plan catalog')
      ) {
        return withCors(
          request,
          jsonError('VALIDATION_ERROR', msg, 400)
        );
      }
    }
    return handleRouteError(request, err);
  }
}
