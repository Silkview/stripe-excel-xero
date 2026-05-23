-- Plans catalog and onboarding fields

create table core.plans (
  code                            text primary key,
  name                            text not null,
  description                     text not null default '',
  features                        jsonb not null default '[]'::jsonb,
  max_users                       int not null,
  max_workspaces                  int not null,
  max_stripe_connections          int not null,
  max_xero_connections_per_workspace int not null default 1,
  stripe_price_id                 text,
  sort_order                      int not null default 0,
  created_at                      timestamptz default now()
);

insert into core.plans (
  code, name, description, features,
  max_users, max_workspaces, max_stripe_connections,
  max_xero_connections_per_workspace, stripe_price_id, sort_order
) values
(
  'free',
  'Free',
  'Get started with one workspace and core sync features.',
  '["Excel add-in for Stripe & Xero","1 user","1 workspace","1 Stripe account","1 Xero organisation per workspace","Pull charges, payouts & balance activity"]'::jsonb,
  1, 1, 1, 1, null, 0
),
(
  'pro',
  'Pro',
  'For solo operators who need a single workspace.',
  '["Everything in Free","1 user","1 workspace","1 Stripe account","1 Xero organisation","Priority email support"]'::jsonb,
  1, 1, 1, 1, null, 1
),
(
  'firm',
  'Firm',
  'For teams managing multiple clients in one account.',
  '["Up to 5 users (invite team)","Up to 5 workspaces","Up to 5 Stripe accounts (account-wide)","1 Xero org per workspace","Multi-workspace switching in Excel"]'::jsonb,
  5, 5, 5, 1, null, 2
);

alter table core.accounts
  add column if not exists plan_code text references core.plans(code),
  add column if not exists onboarding_completed_at timestamptz;

-- Backfill existing accounts
update core.accounts
set plan_code = case
  when plan in ('pro', 'firm', 'canceled') then plan
  else 'free'
end
where plan_code is null;

update core.accounts
set onboarding_completed_at = now()
where onboarding_completed_at is null
  and exists (
    select 1 from core.workspaces w where w.account_id = core.accounts.id
  );

alter table core.accounts
  alter column plan_code set default 'free';

update core.accounts set plan_code = 'free' where plan_code is null;

alter table core.accounts
  alter column plan_code set not null;

-- Keep legacy plan column in sync
create or replace function core.sync_account_plan_from_code()
returns trigger language plpgsql as $$
begin
  new.plan := case new.plan_code
    when 'free' then 'trialing'
    else new.plan_code
  end;
  return new;
end $$;

drop trigger if exists sync_account_plan on core.accounts;
create trigger sync_account_plan
  before insert or update of plan_code on core.accounts
  for each row execute function core.sync_account_plan_from_code();

update core.accounts set plan = plan_code where plan_code in ('pro', 'firm', 'canceled');
update core.accounts set plan = 'trialing' where plan_code = 'free';

-- Replace check_plan_limit with stripe + xero support
create or replace function core.check_plan_limit(
  p_account_id uuid,
  p_resource text,
  p_workspace_id uuid default null
) returns boolean language plpgsql security definer
set search_path = core
as $$
declare
  v_max int;
  v_current int;
begin
  if p_resource = 'user' then
    select max_users into v_max from core.accounts where id = p_account_id;
    select count(*)::int into v_current from core.account_users
      where account_id = p_account_id;
  elsif p_resource = 'workspace' then
    select max_workspaces into v_max from core.accounts where id = p_account_id;
    select count(*)::int into v_current from core.workspaces
      where account_id = p_account_id;
  elsif p_resource = 'stripe' then
    select p.max_stripe_connections into v_max
    from core.accounts a
    join core.plans p on p.code = a.plan_code
    where a.id = p_account_id;
    select count(*)::int into v_current
    from core.stripe_connections sc
    join core.workspaces w on w.id = sc.workspace_id
    where w.account_id = p_account_id and sc.is_active = true;
  elsif p_resource = 'xero' then
    if p_workspace_id is null then
      return false;
    end if;
    select max_xero_connections_per_workspace into v_max
    from core.accounts a
    join core.plans p on p.code = a.plan_code
    where a.id = p_account_id;
    select count(*)::int into v_current from core.xero_connections
      where workspace_id = p_workspace_id and is_active = true;
  else
    return false;
  end if;

  if v_max is null then
    return false;
  end if;

  return v_current < v_max;
end $$;

alter table core.plans enable row level security;

create policy "plans: public read"
  on core.plans for select
  using (true);

grant select on core.plans to anon, authenticated, service_role;
grant all on core.plans to postgres, service_role;
