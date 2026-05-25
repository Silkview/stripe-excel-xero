-- Extend billing_webhook_events.source check constraint to cover the
-- additional event sources introduced for auto-downgrade and user cancel
-- flows ('cron' for trial-expired / past-due-30d sweeps, 'user_cancel'
-- for explicit cancellations). Migration 011 only allowed
-- ('webhook', 'checkout_confirm').

alter table core.billing_webhook_events
  drop constraint if exists billing_webhook_events_source_check;

alter table core.billing_webhook_events
  add constraint billing_webhook_events_source_check
    check (source in ('webhook', 'checkout_confirm', 'cron', 'user_cancel'));
