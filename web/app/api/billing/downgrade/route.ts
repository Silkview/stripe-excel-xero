import { requireAccountAdmin } from '@/lib/api-auth';
import {
  needsDowngradeSelection,
  requireBillingAccess,
} from '@/lib/billing/access';
import {
  disconnectStripeConnection,
} from '@/lib/connections/store';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { membership } = await requireAccountAdmin(request);
    await requireBillingAccess(membership.account_id);

    const admin = createSupabaseAdmin();
    const { data: workspaces } = await core(admin)
      .from('workspaces')
      .select('id, name')
      .eq('account_id', membership.account_id)
      .order('created_at', { ascending: true });

    const result = [];
    for (const ws of workspaces ?? []) {
      const { data: stripe } = await core(admin)
        .from('stripe_connections')
        .select('id, stripe_account_id, display_name')
        .eq('workspace_id', ws.id)
        .eq('is_active', true)
        .order('connected_at', { ascending: true });

      const { data: xero } = await core(admin)
        .from('xero_connections')
        .select('id, tenant_name')
        .eq('workspace_id', ws.id)
        .eq('is_active', true)
        .order('connected_at', { ascending: true });

      result.push({
        id: ws.id,
        name: ws.name,
        stripe: stripe ?? [],
        xero: xero ?? [],
      });
    }

    return ok(request, { workspaces: result });
  } catch (err) {
    return handleRouteError(request, err);
  }
}

export async function POST(request: Request) {
  try {
    const { membership } = await requireAccountAdmin(request);
    const accountId = membership.account_id;

    if (!(await needsDowngradeSelection(accountId))) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Downgrade selection is not required.', 400)
      );
    }

    const body = await request.json();
    const workspaceId = body.workspaceId as string | undefined;
    const stripeConnectionIds = (body.stripeConnectionIds ?? []) as string[];
    const xeroConnectionId = body.xeroConnectionId as string | undefined;

    if (!workspaceId) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'workspaceId is required.', 400)
      );
    }

    const admin = createSupabaseAdmin();

    const { data: workspaces } = await core(admin)
      .from('workspaces')
      .select('id')
      .eq('account_id', accountId);

    const workspaceIds = (workspaces ?? []).map((w) => w.id);
    if (!workspaceIds.includes(workspaceId)) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Invalid workspace.', 400)
      );
    }

    const { data: stripeConns } = await core(admin)
      .from('stripe_connections')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    const { data: xeroConns } = await core(admin)
      .from('xero_connections')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    const activeStripe = stripeConns ?? [];
    const activeXero = xeroConns ?? [];

    if (activeStripe.length > 0 && stripeConnectionIds.length !== 1) {
      return withCors(
        request,
        jsonError(
          'VALIDATION_ERROR',
          'Select exactly one Stripe connection to keep.',
          400
        )
      );
    }

    if (activeXero.length > 0 && !xeroConnectionId) {
      return withCors(
        request,
        jsonError(
          'VALIDATION_ERROR',
          'Select one Xero organisation to keep.',
          400
        )
      );
    }

    if (
      stripeConnectionIds.length === 1 &&
      !activeStripe.some((s) => s.id === stripeConnectionIds[0])
    ) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Invalid Stripe connection.', 400)
      );
    }

    if (
      xeroConnectionId &&
      !activeXero.some((x) => x.id === xeroConnectionId)
    ) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Invalid Xero connection.', 400)
      );
    }

    for (const wsId of workspaceIds) {
      if (wsId === workspaceId) continue;
      await core(admin).from('workspaces').delete().eq('id', wsId);
    }

    const keepStripeId = stripeConnectionIds[0];
    for (const s of activeStripe) {
      if (s.id !== keepStripeId) {
        await disconnectStripeConnection(workspaceId, {
          connectionId: s.id,
        });
      }
    }

    for (const x of activeXero) {
      if (x.id !== xeroConnectionId) {
        await core(admin)
          .from('xero_connections')
          .update({ is_active: false })
          .eq('id', x.id)
          .eq('workspace_id', workspaceId);
      }
    }

    await core(admin)
      .from('accounts')
      .update({ billing_downgrade_completed_at: new Date().toISOString() })
      .eq('id', accountId);

    return ok(request, { completed: true });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
