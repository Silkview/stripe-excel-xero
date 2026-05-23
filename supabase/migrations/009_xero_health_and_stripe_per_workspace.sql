-- Xero connection health + Firm multi-Stripe per workspace

alter table core.xero_connections
  add column if not exists refresh_failed_at timestamptz,
  add column if not exists refresh_error_code text;

alter table core.stripe_connections
  add column if not exists is_default boolean not null default false;

alter table core.plans
  add column if not exists max_stripe_connections_per_workspace int not null default 1;

update core.plans
set max_stripe_connections_per_workspace = 1
where code in ('free', 'pro');

update core.plans
set max_stripe_connections_per_workspace = 5
where code = 'firm';

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
  v_max_account int;
  v_current_account int;
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
    if p_workspace_id is null then
      return false;
    end if;
    select p.max_stripe_connections_per_workspace into v_max
    from core.accounts a
    join core.plans p on p.code = a.plan_code
    where a.id = p_account_id;
    select count(*)::int into v_current from core.stripe_connections
      where workspace_id = p_workspace_id and is_active = true;

    if v_max is null or v_current >= v_max then
      return false;
    end if;

    select p.max_stripe_connections into v_max_account
    from core.accounts a
    join core.plans p on p.code = a.plan_code
    where a.id = p_account_id;
    select count(*)::int into v_current_account
    from core.stripe_connections sc
    join core.workspaces w on w.id = sc.workspace_id
    where w.account_id = p_account_id and sc.is_active = true;

    if v_max_account is null then
      return false;
    end if;

    return v_current_account < v_max_account;
  elsif p_resource = 'xero' then
    if p_workspace_id is null then
      return false;
    end if;
    select p.max_xero_connections_per_workspace into v_max
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
