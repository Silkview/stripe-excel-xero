-- check_plan_limit referenced accounts.max_stripe_connections, which does not exist.
-- Stripe caps live on core.plans (same pattern as xero).
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
