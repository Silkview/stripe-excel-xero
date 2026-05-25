-- Track Stripe billing interval (monthly vs annual) per account.
-- This column was previously added directly to production but never captured
-- as a migration, so freshly-provisioned environments (e.g. local dev) lacked
-- it. load-context.ts and sync-subscription.ts both select/update this column;
-- without it PostgREST 400's and the dashboard layout falls through to the
-- onboarding redirect, manifesting as a "blank" dashboard.

alter table core.accounts
  add column if not exists billing_interval text;

alter table core.accounts
  drop constraint if exists accounts_billing_interval_check;

alter table core.accounts
  add constraint accounts_billing_interval_check
    check (billing_interval is null or billing_interval in ('monthly', 'annual'));
