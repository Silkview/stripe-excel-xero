import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import type { Json } from '@/types/database.types';

export type BillingEventSource =
  | 'webhook'
  | 'checkout_confirm'
  | 'cron'
  | 'user_cancel';
export type BillingEventStatus =
  | 'received'
  | 'processed'
  | 'failed'
  | 'ignored';

export type RecordBillingEventInput = {
  source: BillingEventSource;
  stripeEventId?: string | null;
  eventType: string;
  accountId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  checkoutSessionId?: string | null;
  invoiceId?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  status?: BillingEventStatus;
  processingError?: string | null;
  payload?: Json | null;
};

export async function recordBillingEvent(
  input: RecordBillingEventInput
): Promise<{ id: string; duplicate: boolean }> {
  const admin = createSupabaseAdmin();
  const row = {
    source: input.source,
    stripe_event_id: input.stripeEventId ?? null,
    event_type: input.eventType,
    account_id: input.accountId ?? null,
    stripe_customer_id: input.stripeCustomerId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    checkout_session_id: input.checkoutSessionId ?? null,
    invoice_id: input.invoiceId ?? null,
    amount_cents: input.amountCents ?? null,
    currency: input.currency ?? null,
    status: input.status ?? 'received',
    processing_error: input.processingError ?? null,
    payload: input.payload ?? null,
    processed_at:
      input.status === 'processed' || input.status === 'failed'
        ? new Date().toISOString()
        : null,
  };

  // #region agent log
  fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aa61bb'},body:JSON.stringify({sessionId:'aa61bb',runId:'pre-fix',hypothesisId:'H1',location:'record-event.ts:before_insert',message:'recordBillingEvent attempting insert',data:{source:row.source,event_type:row.event_type,account_id:row.account_id,status:row.status,stack:new Error().stack?.split('\n').slice(1,6).join(' | ')},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (input.stripeEventId) {
    const { data: existing } = await core(admin)
      .from('billing_webhook_events')
      .select('id')
      .eq('stripe_event_id', input.stripeEventId)
      .maybeSingle();

    if (existing?.id) {
      return { id: existing.id, duplicate: true };
    }
  }

  const { data, error } = await core(admin)
    .from('billing_webhook_events')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'aa61bb'},body:JSON.stringify({sessionId:'aa61bb',runId:'pre-fix',hypothesisId:'H1',location:'record-event.ts:insert_error',message:'recordBillingEvent INSERT failed',data:{code:error.code,message:error.message,details:(error as unknown as {details?:string}).details ?? null,hint:(error as unknown as {hint?:string}).hint ?? null,source:row.source,event_type:row.event_type},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (error.code === '23505' && input.stripeEventId) {
      const { data: dup } = await core(admin)
        .from('billing_webhook_events')
        .select('id')
        .eq('stripe_event_id', input.stripeEventId)
        .maybeSingle();
      return { id: dup?.id ?? '', duplicate: true };
    }
    throw new Error(error.message);
  }

  return { id: data!.id, duplicate: false };
}

export async function markBillingEventProcessed(
  eventRowId: string,
  status: 'processed' | 'failed' | 'ignored',
  processingError?: string
): Promise<void> {
  const admin = createSupabaseAdmin();
  await core(admin)
    .from('billing_webhook_events')
    .update({
      status,
      processing_error: processingError ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventRowId);
}

export async function markBillingEventByStripeId(
  stripeEventId: string,
  status: 'processed' | 'failed' | 'ignored',
  processingError?: string
): Promise<void> {
  const admin = createSupabaseAdmin();
  await core(admin)
    .from('billing_webhook_events')
    .update({
      status,
      processing_error: processingError ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq('stripe_event_id', stripeEventId);
}

export async function updateBillingEventByStripeId(
  stripeEventId: string,
  fields: Partial<
    Pick<
      RecordBillingEventInput,
      | 'accountId'
      | 'stripeCustomerId'
      | 'stripeSubscriptionId'
      | 'checkoutSessionId'
      | 'invoiceId'
      | 'amountCents'
      | 'currency'
    >
  >
): Promise<void> {
  const admin = createSupabaseAdmin();
  await core(admin)
    .from('billing_webhook_events')
    .update({
      account_id: fields.accountId ?? undefined,
      stripe_customer_id: fields.stripeCustomerId ?? undefined,
      stripe_subscription_id: fields.stripeSubscriptionId ?? undefined,
      checkout_session_id: fields.checkoutSessionId ?? undefined,
      invoice_id: fields.invoiceId ?? undefined,
      amount_cents: fields.amountCents ?? undefined,
      currency: fields.currency ?? undefined,
    })
    .eq('stripe_event_id', stripeEventId);
}
