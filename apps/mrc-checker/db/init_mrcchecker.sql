create schema if not exists app_mrcchecker;

create table if not exists app_mrcchecker.app_mrcchecker_analysis_runs (
  id bigserial primary key,
  request_id uuid not null unique,
  source_label text,
  raw_input text not null,
  question text,
  field_coverage integer not null,
  matched_fields integer not null,
  attention_fields integer not null,
  missing_fields integer not null,
  gate_passed boolean not null,
  missing_required_fields text[] not null default '{}',
  summary jsonb not null default '{}'::jsonb,
  structured_data jsonb not null default '{}'::jsonb,
  field_checks jsonb not null default '[]'::jsonb,
  clause_checks jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  referrals jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_mrcchecker.app_mrcchecker_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_mrcchecker_analysis_runs_created_at
  on app_mrcchecker.app_mrcchecker_analysis_runs (created_at desc);

create index if not exists idx_app_mrcchecker_audit_created_at
  on app_mrcchecker.app_mrcchecker_audit (created_at desc);

grant usage on schema app_mrcchecker to anon, authenticated, service_role;

grant all privileges on all tables in schema app_mrcchecker
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_mrcchecker
  to anon, authenticated, service_role;

alter default privileges in schema app_mrcchecker
  grant all privileges on tables
  to anon, authenticated, service_role;

alter default privileges in schema app_mrcchecker
  grant all privileges on sequences
  to anon, authenticated, service_role;
