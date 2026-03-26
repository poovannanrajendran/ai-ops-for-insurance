create schema if not exists app_sanctionsscreening;

grant usage on schema app_sanctionsscreening to postgres, anon, authenticated, service_role;

create table if not exists app_sanctionsscreening.app_sanctionsscreening_analysis_runs (
  request_id uuid primary key,
  created_at timestamptz not null default now(),
  source_label text,
  screening_text text not null,
  question text,
  summary jsonb not null,
  matches jsonb not null,
  recommended_actions jsonb not null,
  briefing_narrative jsonb not null,
  query_hits jsonb not null,
  warnings jsonb not null,
  whitespace_rows jsonb not null,
  raw_analysis jsonb not null
);

create table if not exists app_sanctionsscreening.app_sanctionsscreening_audit (
  id bigint generated always as identity primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists app_sanctionsscreening.app_sanctionsscreening_feed_state (
  source_name text primary key,
  source_url text not null,
  etag text,
  last_modified text,
  content_hash text,
  last_row_count integer not null default 0,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  status text not null default 'unknown',
  message text
);

create table if not exists app_sanctionsscreening.app_sanctionsscreening_watchlist_entries (
  id bigint generated always as identity primary key,
  source_name text not null,
  source_url text not null,
  list_name text not null,
  entity_name text not null,
  entity_name_normalized text not null,
  risk text not null check (risk in ('high', 'medium', 'low')),
  external_id text,
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (source_name, entity_name_normalized)
);

create index if not exists idx_sanctionsscreening_runs_created_at
  on app_sanctionsscreening.app_sanctionsscreening_analysis_runs (created_at desc);

create index if not exists idx_sanctionsscreening_audit_request_id
  on app_sanctionsscreening.app_sanctionsscreening_audit (request_id, created_at);

create index if not exists idx_sanctionsscreening_watchlist_entity
  on app_sanctionsscreening.app_sanctionsscreening_watchlist_entries (entity_name_normalized);

create index if not exists idx_sanctionsscreening_feed_state_success
  on app_sanctionsscreening.app_sanctionsscreening_feed_state (last_success_at desc);

grant select, insert, update, delete on all tables in schema app_sanctionsscreening to postgres, anon, authenticated, service_role;
grant usage, select on all sequences in schema app_sanctionsscreening to postgres, anon, authenticated, service_role;
alter default privileges in schema app_sanctionsscreening grant select, insert, update, delete on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema app_sanctionsscreening grant usage, select on sequences to postgres, anon, authenticated, service_role;
