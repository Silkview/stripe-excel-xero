-- Workspace-scoped team invitations and member access

create table if not exists core.invitation_workspaces (
  invitation_id uuid not null references core.account_invitations(id) on delete cascade,
  workspace_id uuid not null references core.workspaces(id) on delete cascade,
  primary key (invitation_id, workspace_id)
);

create table if not exists core.account_user_workspaces (
  account_user_id uuid not null references core.account_users(id) on delete cascade,
  workspace_id uuid not null references core.workspaces(id) on delete cascade,
  primary key (account_user_id, workspace_id)
);

create index if not exists invitation_workspaces_workspace_id_idx
  on core.invitation_workspaces (workspace_id);

create index if not exists account_user_workspaces_workspace_id_idx
  on core.account_user_workspaces (workspace_id);

alter table core.invitation_workspaces enable row level security;
alter table core.account_user_workspaces enable row level security;

create policy "invitation_workspaces: admins manage"
  on core.invitation_workspaces for all
  using (
    exists (
      select 1 from core.account_invitations i
      where i.id = invitation_id
        and i.account_id = core.my_account_id()
        and core.is_account_admin()
    )
  );

create policy "account_user_workspaces: read same account"
  on core.account_user_workspaces for select
  using (
    exists (
      select 1 from core.account_users au
      where au.id = account_user_id
        and au.account_id = core.my_account_id()
    )
  );

create policy "account_user_workspaces: admins manage"
  on core.account_user_workspaces for all
  using (
    exists (
      select 1 from core.account_users au
      where au.id = account_user_id
        and au.account_id = core.my_account_id()
        and core.is_account_admin()
    )
  );

grant all on core.invitation_workspaces to postgres, service_role;
grant all on core.account_user_workspaces to postgres, service_role;
