-- Pro/Firm trial period: 14 days → 30 days

alter table core.accounts
  alter column trial_ends_at set default (now() + interval '30 days');

-- Extend active Pro/Firm trials by 16 days (14 → 30)
update core.accounts
set trial_ends_at = trial_ends_at + interval '16 days'
where subscription_status = 'trialing'
  and plan_code in ('pro', 'firm')
  and trial_ends_at is not null
  and trial_ends_at > now();
