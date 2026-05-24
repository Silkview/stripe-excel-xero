-- Pro downgrade completion timestamp (after checkout resource picker)

alter table core.accounts
  add column if not exists billing_downgrade_completed_at timestamptz;
