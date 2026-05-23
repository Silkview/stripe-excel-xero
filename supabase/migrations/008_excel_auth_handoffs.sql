-- Short-lived tokens for Excel sign-in when Office messageParent is unreliable.
create table if not exists core.excel_auth_handoffs (
  nonce text primary key,
  access_token text not null,
  expires_at timestamptz not null default (now() + interval '3 minutes')
);

create index if not exists excel_auth_handoffs_expires_idx
  on core.excel_auth_handoffs (expires_at);
