-- Track when an account first entered past_due so we can auto-downgrade after 30 days.

alter table core.accounts
  add column if not exists past_due_since timestamptz;

create index if not exists accounts_past_due_idx
  on core.accounts(past_due_since)
  where past_due_since is not null;

-- Backfill: any account currently past_due gets "now" as its past_due_since so
-- the 30-day clock starts from this migration.
update core.accounts
set past_due_since = now()
where subscription_status = 'past_due'
  and past_due_since is null;
