-- Dedupe duplicate provisioning, then enforce one account per user and unique workspace names per account.

-- ---------------------------------------------------------------------------
-- 1. Dedupe account_users (keep earliest membership per user)
-- ---------------------------------------------------------------------------
delete from core.account_users au
where au.id not in (
  select distinct on (user_id) id
  from core.account_users
  order by user_id, joined_at asc nulls last, created_at asc
);

-- ---------------------------------------------------------------------------
-- 2. Dedupe workspaces (keep earliest per account + normalized name)
-- ---------------------------------------------------------------------------
delete from core.workspaces w
where w.id not in (
  select distinct on (account_id, lower(trim(name))) id
  from core.workspaces
  order by account_id, lower(trim(name)), created_at asc
);

-- ---------------------------------------------------------------------------
-- 3. Remove orphaned accounts (no members)
-- ---------------------------------------------------------------------------
delete from core.accounts a
where not exists (
  select 1 from core.account_users au where au.account_id = a.id
);

-- ---------------------------------------------------------------------------
-- 4. Unique constraints
-- ---------------------------------------------------------------------------
create unique index if not exists account_users_user_id_unique
  on core.account_users (user_id);

create unique index if not exists workspaces_account_name_unique
  on core.workspaces (account_id, lower(trim(name)));

-- ---------------------------------------------------------------------------
-- 5. Session-scoped provision lock (used from provision_account RPC wrapper)
-- ---------------------------------------------------------------------------
create or replace function core.lock_user_provisioning(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = core
as $$
begin
  perform pg_advisory_lock(hashtext('provision:' || p_user_id::text));
end;
$$;

create or replace function core.unlock_user_provisioning(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = core
as $$
begin
  perform pg_advisory_unlock(hashtext('provision:' || p_user_id::text));
end;
$$;

grant execute on function core.lock_user_provisioning(uuid) to service_role;
grant execute on function core.unlock_user_provisioning(uuid) to service_role;
