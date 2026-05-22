create extension if not exists "uuid-ossp";

create schema if not exists core;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table core.accounts (
  id                     uuid primary key default uuid_generate_v4(),
  name                   text not null,
  plan                   text not null default 'trialing'
                           check (plan in ('trialing','pro','firm','canceled')),
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    text default 'trialing'
                           check (subscription_status in (
                             'trialing','active','past_due',
                             'canceled','unpaid','incomplete')),
  trial_ends_at          timestamptz default (now() + interval '14 days'),
  current_period_end     timestamptz,
  max_users              int not null default 1,
  max_workspaces         int not null default 1,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

create table core.account_users (
  id          uuid primary key default uuid_generate_v4(),
  account_id  uuid not null references core.accounts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member'
                check (role in ('owner','admin','member')),
  invited_by  uuid references auth.users(id),
  joined_at   timestamptz default now(),
  created_at  timestamptz default now(),
  unique (account_id, user_id)
);

create table core.workspaces (
  id          uuid primary key default uuid_generate_v4(),
  account_id  uuid not null references core.accounts(id) on delete cascade,
  name        text not null,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table core.xero_connections (
  id                      uuid primary key default uuid_generate_v4(),
  workspace_id            uuid not null unique
                            references core.workspaces(id) on delete cascade,
  tenant_id               text not null,
  tenant_name             text,
  base_currency           text,
  access_token_encrypted  text not null,
  refresh_token_encrypted text not null,
  token_expires_at        timestamptz not null,
  scopes                  text[],
  connected_by            uuid references auth.users(id),
  connected_at            timestamptz default now(),
  last_refreshed_at       timestamptz,
  is_active               boolean default true
);

create table core.stripe_connections (
  id                     uuid primary key default uuid_generate_v4(),
  workspace_id           uuid not null
                           references core.workspaces(id) on delete cascade,
  stripe_account_id      text not null,
  display_name           text,
  access_token_encrypted text not null,
  livemode               boolean default false,
  scope                  text default 'read_only',
  connected_by           uuid references auth.users(id),
  connected_at           timestamptz default now(),
  is_active              boolean default true,
  unique (workspace_id, stripe_account_id)
);

create table core.account_invitations (
  id          uuid primary key default uuid_generate_v4(),
  account_id  uuid not null references core.accounts(id) on delete cascade,
  email       text not null,
  role        text not null default 'member'
                check (role in ('admin','member')),
  token       text not null unique default encode(gen_random_bytes(32),'hex'),
  invited_by  uuid references auth.users(id),
  expires_at  timestamptz default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Triggers & functions
-- ---------------------------------------------------------------------------

create or replace function core.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger set_updated_at before update on core.accounts
  for each row execute function core.set_updated_at();
create trigger set_updated_at before update on core.workspaces
  for each row execute function core.set_updated_at();

create or replace function core.check_plan_limit(
  p_account_id uuid,
  p_resource text
) returns boolean language plpgsql security definer
set search_path = core
as $$
declare
  v_max int; v_current int;
begin
  if p_resource = 'user' then
    select max_users into v_max from core.accounts where id = p_account_id;
    select count(*) into v_current from core.account_users
      where account_id = p_account_id;
  elsif p_resource = 'workspace' then
    select max_workspaces into v_max from core.accounts where id = p_account_id;
    select count(*) into v_current from core.workspaces
      where account_id = p_account_id;
  end if;
  return v_current < v_max;
end $$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table core.accounts enable row level security;
alter table core.account_users enable row level security;
alter table core.workspaces enable row level security;
alter table core.xero_connections enable row level security;
alter table core.stripe_connections enable row level security;
alter table core.account_invitations enable row level security;

create or replace function core.my_account_id()
returns uuid language sql security definer stable
set search_path = core
as $$
  select account_id from core.account_users
  where user_id = auth.uid() limit 1
$$;

create or replace function core.is_account_admin()
returns boolean language sql security definer stable
set search_path = core
as $$
  select exists (
    select 1 from core.account_users
    where user_id = auth.uid()
    and role in ('owner','admin')
  )
$$;

create policy "accounts: members can read"
  on core.accounts for select
  using (id = core.my_account_id());

create policy "accounts: admins can update"
  on core.accounts for update
  using (id = core.my_account_id() and core.is_account_admin());

create policy "account_users: read same account"
  on core.account_users for select
  using (account_id = core.my_account_id());

create policy "account_users: admins can insert"
  on core.account_users for insert
  with check (account_id = core.my_account_id() and core.is_account_admin());

create policy "account_users: admins can delete"
  on core.account_users for delete
  using (account_id = core.my_account_id() and core.is_account_admin());

create policy "workspaces: read same account"
  on core.workspaces for select
  using (account_id = core.my_account_id());

create policy "workspaces: admins can insert"
  on core.workspaces for insert
  with check (account_id = core.my_account_id() and core.is_account_admin());

create policy "workspaces: admins can update delete"
  on core.workspaces for all
  using (account_id = core.my_account_id() and core.is_account_admin());

create policy "xero: read if workspace member"
  on core.xero_connections for select
  using (workspace_id in (
    select id from core.workspaces where account_id = core.my_account_id()
  ));

create policy "xero: admins can manage"
  on core.xero_connections for all
  using (workspace_id in (
    select id from core.workspaces where account_id = core.my_account_id()
  ) and core.is_account_admin());

create policy "stripe: read if workspace member"
  on core.stripe_connections for select
  using (workspace_id in (
    select id from core.workspaces where account_id = core.my_account_id()
  ));

create policy "stripe: admins can manage"
  on core.stripe_connections for all
  using (workspace_id in (
    select id from core.workspaces where account_id = core.my_account_id()
  ) and core.is_account_admin());

create policy "invitations: admins can manage"
  on core.account_invitations for all
  using (account_id = core.my_account_id() and core.is_account_admin());

-- ---------------------------------------------------------------------------
-- Grants (PostgREST / Supabase API)
-- ---------------------------------------------------------------------------

grant usage on schema core to postgres, anon, authenticated, service_role;

grant all on all tables in schema core to postgres, service_role;
grant select, insert, update, delete on all tables in schema core to authenticated;

grant all on all routines in schema core to postgres, service_role;
grant execute on all routines in schema core to authenticated;

alter default privileges in schema core
  grant all on tables to postgres, service_role;
alter default privileges in schema core
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema core
  grant all on routines to postgres, service_role;
alter default privileges in schema core
  grant execute on routines to authenticated;
