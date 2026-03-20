create schema if not exists app_fnoltriage;

create table if not exists app_fnoltriage.app_fnoltriage_analysis_runs (
  id bigserial primary key,
  request_id uuid not null unique,
  source_label text,
  raw_fnol_text text not null,
  question text,
  summary jsonb not null,
  parsed_fnol jsonb not null,
  factors jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  decision jsonb not null,
  query_hits jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_fnoltriage.app_fnoltriage_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_fnoltriage_analysis_runs_created_at
  on app_fnoltriage.app_fnoltriage_analysis_runs (created_at desc);

create index if not exists idx_app_fnoltriage_audit_created_at
  on app_fnoltriage.app_fnoltriage_audit (created_at desc);

grant usage on schema app_fnoltriage to anon, authenticated, service_role;

grant all privileges on all tables in schema app_fnoltriage
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_fnoltriage
  to anon, authenticated, service_role;

alter default privileges in schema app_fnoltriage
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema app_fnoltriage
  grant all on sequences to anon, authenticated, service_role;
