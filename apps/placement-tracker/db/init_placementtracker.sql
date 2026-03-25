create schema if not exists app_placementtracker;

create table if not exists app_placementtracker.app_placementtracker_analysis_runs (
  id bigserial primary key,
  request_id uuid not null unique,
  source_label text,
  raw_csv_text text not null,
  question text,
  summary jsonb not null,
  status_lanes jsonb not null default '[]'::jsonb,
  market_progression jsonb not null,
  priority_flags jsonb not null default '[]'::jsonb,
  commentary jsonb not null,
  query_hits jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_placementtracker.app_placementtracker_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_placementtracker_analysis_runs_created_at
  on app_placementtracker.app_placementtracker_analysis_runs (created_at desc);

create index if not exists idx_app_placementtracker_analysis_runs_request_id
  on app_placementtracker.app_placementtracker_analysis_runs (request_id);

create index if not exists idx_app_placementtracker_audit_created_at
  on app_placementtracker.app_placementtracker_audit (created_at desc);

create index if not exists idx_app_placementtracker_audit_request_id
  on app_placementtracker.app_placementtracker_audit (request_id);

create index if not exists idx_app_placementtracker_audit_stage
  on app_placementtracker.app_placementtracker_audit (stage);

grant usage on schema app_placementtracker to anon, authenticated, service_role;

grant all privileges on all tables in schema app_placementtracker
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_placementtracker
  to anon, authenticated, service_role;

alter default privileges in schema app_placementtracker
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema app_placementtracker
  grant all on sequences to anon, authenticated, service_role;
