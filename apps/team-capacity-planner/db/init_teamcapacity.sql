create schema if not exists app_teamcapacity;

grant usage on schema app_teamcapacity to postgres, anon, authenticated, service_role;

create table if not exists app_teamcapacity.app_teamcapacity_analysis_runs (
  request_id uuid primary key,
  created_at timestamptz not null default now(),
  source_label text,
  capacity_text text not null,
  question text,
  summary jsonb not null,
  extracted_fields jsonb not null,
  allocation_narrative jsonb not null,
  action_plan jsonb not null,
  prompt_hits jsonb not null,
  warnings jsonb not null,
  whitespace_rows jsonb not null,
  raw_analysis jsonb not null
);

create table if not exists app_teamcapacity.app_teamcapacity_audit (
  id bigint generated always as identity primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_teamcapacity_runs_created_at
  on app_teamcapacity.app_teamcapacity_analysis_runs (created_at desc);

create index if not exists idx_teamcapacity_audit_request_id
  on app_teamcapacity.app_teamcapacity_audit (request_id, created_at);

grant select, insert, update, delete on all tables in schema app_teamcapacity to postgres, anon, authenticated, service_role;
grant usage, select on all sequences in schema app_teamcapacity to postgres, anon, authenticated, service_role;
alter default privileges in schema app_teamcapacity grant select, insert, update, delete on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema app_teamcapacity grant usage, select on sequences to postgres, anon, authenticated, service_role;
