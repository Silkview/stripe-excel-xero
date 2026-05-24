-- Billing webhook and checkout confirm audit log

create table core.billing_webhook_events (
  id                      uuid primary key default gen_random_uuid(),
  source                  text not null default 'webhook'
                            check (source in ('webhook', 'checkout_confirm')),
  stripe_event_id         text unique,
  event_type              text not null,
  account_id              uuid references core.accounts(id) on delete set null,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  checkout_session_id     text,
  invoice_id              text,
  amount_cents            bigint,
  currency                text,
  status                  text not null default 'received'
                            check (status in ('received', 'processed', 'failed', 'ignored')),
  processing_error        text,
  payload                 jsonb,
  created_at              timestamptz default now(),
  processed_at            timestamptz
);

create index billing_webhook_events_account_created_idx
  on core.billing_webhook_events (account_id, created_at desc);

create index billing_webhook_events_type_idx
  on core.billing_webhook_events (event_type);
