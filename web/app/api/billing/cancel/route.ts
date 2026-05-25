import { requireAccountAdmin } from '@/lib/api-auth';
import { downgradeAccountToFree } from '@/lib/billing/downgrade-to-free';
import { getStripe } from '@/lib/stripe-billing';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function POST(request: Request) {
  try {
    const { membership } = await requireAccountAdmin(request);
    const accountId = membership.account_id;

    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aa61bb'},body:JSON.stringify({sessionId:'aa61bb',runId:'pre-fix',hypothesisId:'H1',location:'api/billing/cancel:POST',message:'cancel route entered',data:{accountId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const admin = createSupabaseAdmin();
    const { data: account } = await core(admin)
      .from('accounts')
      .select('stripe_subscription_id')
      .eq('id', accountId)
      .maybeSingle();

    if (account?.stripe_subscription_id) {
      try {
        await getStripe().subscriptions.cancel(account.stripe_subscription_id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.toLowerCase().includes('no such subscription')) {
          throw err;
        }
      }
    }

    await downgradeAccountToFree(accountId, 'user_cancel');

    return ok(request, { ok: true });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
