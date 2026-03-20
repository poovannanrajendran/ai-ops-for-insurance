create schema if not exists app_policyendorsementdiff;

create table if not exists app_policyendorsementdiff.app_policyendorsementdiff_analysis_runs (
  id bigserial primary key,
  request_id uuid not null unique,
  source_label text,
  expiring_text text not null,
  renewal_text text not null,
  question text,
  summary jsonb not null,
  executive_brief jsonb not null,
  clause_diffs jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  query_hits jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_policyendorsementdiff.app_policyendorsementdiff_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_policyendorsementdiff_analysis_runs_created_at
  on app_policyendorsementdiff.app_policyendorsementdiff_analysis_runs (created_at desc);

create index if not exists idx_app_policyendorsementdiff_audit_created_at
  on app_policyendorsementdiff.app_policyendorsementdiff_audit (created_at desc);

grant usage on schema app_policyendorsementdiff to anon, authenticated, service_role;

grant all privileges on all tables in schema app_policyendorsementdiff
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_policyendorsementdiff
  to anon, authenticated, service_role;

alter default privileges in schema app_policyendorsementdiff
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema app_policyendorsementdiff
  grant all on sequences to anon, authenticated, service_role;
