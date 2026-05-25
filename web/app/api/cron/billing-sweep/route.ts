import { NextResponse } from 'next/server';
import { downgradeAccountToFree } from '@/lib/billing/downgrade-to-free';
import { getStripe } from '@/lib/stripe-billing';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const THIRTY_DAYS_MS = 30 * 86400000;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}

async function sweepTrialExpired(): Promise<number> {
  const admin = createSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: rows } = await core(admin)
    .from('accounts')
    .select('id')
    .in('plan_code', ['pro', 'firm'])
    .eq('subscription_status', 'trialing')
    .is('stripe_subscription_id', null)
    .lte('trial_ends_at', nowIso);

  for (const row of rows ?? []) {
    await downgradeAccountToFree(row.id, 'trial_expired');
  }
  return (rows ?? []).length;
}

async function sweepPastDue30Days(): Promise<number> {
  const admin = createSupabaseAdmin();
  const cutoffIso = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  const { data: rows } = await core(admin)
    .from('accounts')
    .select('id, stripe_subscription_id')
    .eq('subscription_status', 'past_due')
    .lte('past_due_since', cutoffIso);

  for (const row of rows ?? []) {
    if (row.stripe_subscription_id) {
      try {
        await getStripe().subscriptions.cancel(row.stripe_subscription_id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.toLowerCase().includes('no such subscription')) {
          console.warn(
            'billing-sweep: failed to cancel sub',
            row.stripe_subscription_id,
            msg
          );
        }
      }
    }
    await downgradeAccountToFree(row.id, 'past_due_30d');
  }
  return (rows ?? []).length;
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret.' } },
      { status: 401 }
    );
  }

  try {
    const [trialExpired, pastDueDowngraded] = await Promise.all([
      sweepTrialExpired(),
      sweepPastDue30Days(),
    ]);
    return NextResponse.json({
      success: true,
      data: { trialExpired, pastDueDowngraded },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: { code: 'CRON_FAILED', message } },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
