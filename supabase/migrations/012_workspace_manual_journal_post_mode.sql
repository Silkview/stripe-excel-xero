alter table core.workspaces
  add column manual_journal_post_mode text not null default 'draft_and_post'
  check (manual_journal_post_mode in ('draft_only', 'draft_and_post'));
