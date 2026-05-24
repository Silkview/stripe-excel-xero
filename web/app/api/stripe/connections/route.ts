import { requireWorkspace, getAccountMembership } from '@/lib/api-auth';
import {
  listStripeConnections,
  listStripeConnectionsForAccount,
  disconnectStripeConnection,
  updateStripeConnectionDisplayName,
} from '@/lib/connections/store';
import { getPlanByCode } from '@/lib/plans/catalog';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';
import type { PlanCode } from '@/lib/plans/types';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { user, workspaceId } = await requireWorkspace(request);
    const membership = await getAccountMembership(user.id);
    if (!membership) {
      return withCors(
        request,
        jsonError('ACCOUNT_REQUIRED', 'No account.', 403)
      );
    }

    const connections = await listStripeConnections(workspaceId);
    const accountWide = await listStripeConnectionsForAccount(
      membership.account_id
    );

    const admin = createSupabaseAdmin();
    const { data: account } = await core(admin)
      .from('accounts')
      .select('plan_code')
      .eq('id', membership.account_id)
      .single();
    const plan = await getPlanByCode(
      (account?.plan_code ?? 'free') as PlanCode
    );

    return ok(request, {
      connections: connections.map((c) => ({
        id: c.id,
        stripeAccountId: c.stripe_account_id,
        displayName: c.display_name,
        workspaceId: c.workspace_id,
        isDefault: c.is_default ?? false,
      })),
      workspaceStripeCount: connections.length,
      accountStripeCount: accountWide.length,
      limits: plan
        ? {
            maxStripeConnectionsPerWorkspace:
              plan.max_stripe_connections_per_workspace,
            maxStripeConnectionsAccountWide: plan.max_stripe_connections,
          }
        : null,
    });
  } catch (err) {
    return handleRouteError(request, err);
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    const body = (await request.json()) as {
      connectionId?: string;
      displayName?: string;
    };

    if (!body.connectionId?.trim()) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'connectionId is required.', 400)
      );
    }
    if (!body.displayName?.trim()) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'displayName is required.', 400)
      );
    }

    await updateStripeConnectionDisplayName(
      workspaceId,
      body.connectionId.trim(),
      body.displayName
    );
    return ok(request, { updated: true });
  } catch (err) {
    return handleRouteError(request, err);
  }
}

export async function DELETE(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    let body: { connectionId?: string; stripeAccountId?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      // empty body disconnects all (legacy)
    }

    await disconnectStripeConnection(workspaceId, {
      connectionId: body.connectionId,
      stripeAccountId: body.stripeAccountId,
    });
    return ok(request, { disconnected: true });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
