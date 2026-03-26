create schema if not exists app_regulatorydigest;

create table if not exists app_regulatorydigest.app_regulatorydigest_analysis_runs (
  id bigserial primary key,
  request_id uuid not null unique,
  source_label text,
  feed_text text not null,
  class_focus text not null,
  question text,
  summary jsonb not null,
  executive_brief jsonb not null,
  priority_alerts jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  updates jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  query_hits jsonb not null default '[]'::jsonb,
  whitespace_rows jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_regulatorydigest.app_regulatorydigest_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_regulatorydigest_analysis_runs_created_at
  on app_regulatorydigest.app_regulatorydigest_analysis_runs (created_at desc);

create index if not exists idx_app_regulatorydigest_audit_created_at
  on app_regulatorydigest.app_regulatorydigest_audit (created_at desc);

grant usage on schema app_regulatorydigest to anon, authenticated, service_role;

grant all privileges on all tables in schema app_regulatorydigest
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_regulatorydigest
  to anon, authenticated, service_role;

alter default privileges in schema app_regulatorydigest
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema app_regulatorydigest
  grant all on sequences to anon, authenticated, service_role;
