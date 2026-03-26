create schema if not exists app_dataquality;

grant usage on schema app_dataquality to postgres, anon, authenticated, service_role;

create table if not exists app_dataquality.app_dataquality_analysis_runs (
  request_id uuid primary key,
  created_at timestamptz not null default now(),
  source_label text,
  dataset_text text not null,
  question text,
  summary jsonb not null,
  issues jsonb not null,
  fix_suggestions jsonb not null,
  briefing_narrative jsonb not null,
  warnings jsonb not null,
  query_hits jsonb not null,
  whitespace_rows jsonb not null,
  raw_analysis jsonb not null
);

create table if not exists app_dataquality.app_dataquality_audit (
  id bigint generated always as identity primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_dataquality_runs_created_at
  on app_dataquality.app_dataquality_analysis_runs (created_at desc);

create index if not exists idx_dataquality_audit_request_id
  on app_dataquality.app_dataquality_audit (request_id, created_at);

grant select, insert, update, delete on all tables in schema app_dataquality to postgres, anon, authenticated, service_role;
grant usage, select on all sequences in schema app_dataquality to postgres, anon, authenticated, service_role;
alter default privileges in schema app_dataquality grant select, insert, update, delete on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema app_dataquality grant usage, select on sequences to postgres, anon, authenticated, service_role;
