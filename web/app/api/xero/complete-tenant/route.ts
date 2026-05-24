import { saveXeroConnection } from '@/lib/connections/store';
import { enforceXeroConnect } from '@/lib/plan-limits';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { verifyXeroTenantPick } from '@/lib/oauth-state';
import {
  authCallbackErrorHtml,
  authCallbackHtml,
} from '@/lib/api-response';
import { getOrganisationBaseCurrency } from '@/lib/services/xero';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      pick?: string;
      tenantId?: string;
    };
    const pick = body.pick?.trim();
    const tenantId = body.tenantId?.trim();

    if (!pick || !tenantId) {
      return new NextResponse(
        authCallbackErrorHtml('xero', 'Missing organisation selection.'),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const payload = verifyXeroTenantPick(pick);
    if (!payload) {
      return new NextResponse(
        authCallbackErrorHtml(
          'xero',
          'Selection expired. Please connect Xero again.'
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const tenant = payload.tenants.find((t) => t.tenantId === tenantId);
    if (!tenant) {
      return new NextResponse(
        authCallbackErrorHtml('xero', 'Invalid organisation selection.'),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const baseCurrency = await getOrganisationBaseCurrency(
      payload.access_token,
      tenant.tenantId
    );

    const admin = createSupabaseAdmin();
    const { data: ws } = await core(admin)
      .from('workspaces')
      .select('account_id')
      .eq('id', payload.workspaceId)
      .single();

    if (ws?.account_id) {
      const check = await enforceXeroConnect(
        ws.account_id,
        payload.workspaceId
      );
      if (!check.allowed) {
        return new NextResponse(
          authCallbackErrorHtml('xero', check.reason!),
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    }

    await saveXeroConnection(
      payload.workspaceId,
      {
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        expires_at: Date.now() + payload.expires_in * 1000,
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        baseCurrency,
      },
      payload.userId,
      {
        scopes: [
          'accounting.transactions',
          'accounting.settings',
          'accounting.reports.read',
          'offline_access',
        ],
      }
    );

    return new NextResponse(
      authCallbackHtml({
        status: 'xero_connected',
        tenantName: tenant.tenantName,
      }),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to connect Xero.';
    return new NextResponse(authCallbackErrorHtml('xero', message), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
