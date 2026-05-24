import { requireWorkspace } from '@/lib/api-auth';
import { canUseXeroFeatures } from '@/lib/billing/xero-access';
import { getBillingAccess } from '@/lib/billing/access';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import type { PlanCode } from '@/lib/plans/types';
import { ensureXeroBaseCurrency } from '@/lib/services/xero';
import {
  disconnectXeroForWorkspace,
  getXeroConnection,
  getXeroConnectionMeta,
} from '@/lib/connections/store';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';
import { XeroServiceError } from '@/lib/services/xero';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function GET(request: Request) {
  try {
    const { workspaceId, accountId } = await requireWorkspace(request);
    const meta = await getXeroConnectionMeta(workspaceId);
    if (meta.status === 'disconnected') {
      return ok(request, { connected: false, status: 'disconnected' });
    }

    const admin = createSupabaseAdmin();
    const { data: account } = await core(admin)
      .from('accounts')
      .select('plan_code')
      .eq('id', accountId)
      .maybeSingle();
    const planCode = (account?.plan_code ?? 'free') as PlanCode;
    const billingAccess = await getBillingAccess(accountId);
    const xeroEnabled = canUseXeroFeatures(planCode, billingAccess);

    if (!xeroEnabled) {
      return ok(request, {
        connected: false,
        status: meta.status === 'connected' ? 'disconnected' : meta.status,
        tenantName: meta.tenantName,
        tenantId: meta.tenantId,
        xeroFeaturesLocked: true,
      });
    }

    try {
      const baseCurrency = await ensureXeroBaseCurrency(workspaceId);
      const refreshed = await getXeroConnectionMeta(workspaceId);
      const xero = await getXeroConnection(workspaceId);
      return ok(request, {
        connected: refreshed.status === 'connected',
        status: refreshed.status,
        tenantName: xero?.tenantName ?? refreshed.tenantName,
        tenantId: xero?.tenantId ?? refreshed.tenantId,
        baseCurrency,
        refreshErrorCode: refreshed.refreshErrorCode,
      });
    } catch (err) {
      const failedMeta = await getXeroConnectionMeta(workspaceId);
      if (failedMeta.status === 'reconnect_required') {
        return ok(request, {
          connected: false,
          status: 'reconnect_required',
          tenantName: failedMeta.tenantName,
          tenantId: failedMeta.tenantId,
          refreshErrorCode: failedMeta.refreshErrorCode,
        });
      }
      if (err instanceof XeroServiceError) {
        return withCors(request, jsonError(err.code, err.message, 502));
      }
      return withCors(
        request,
        jsonError('XERO_ERROR', 'Failed to load Xero connection.', 502)
      );
    }
  } catch (err) {
    return handleRouteError(request, err);
  }
}

export async function DELETE(request: Request) {
  try {
    const { workspaceId } = await requireWorkspace(request);
    await disconnectXeroForWorkspace(workspaceId);
    return ok(request, { disconnected: true });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
