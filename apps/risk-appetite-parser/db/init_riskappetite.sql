create schema if not exists app_riskappetite;

create table if not exists app_riskappetite.app_riskappetite_analysis_runs (
  id bigserial primary key,
  request_id uuid not null unique,
  source_label text,
  raw_statement_text text not null,
  question text,
  field_coverage integer not null,
  matched_fields integer not null,
  missing_fields integer not null,
  structured_data jsonb not null,
  whitespace_fields jsonb not null,
  warnings jsonb not null,
  commentary jsonb not null,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_riskappetite_analysis_runs_created_at
  on app_riskappetite.app_riskappetite_analysis_runs (created_at desc);

-- Required for Supabase Data API access:
-- 1) Expose schema `app_riskappetite` in Supabase Dashboard -> API -> Data API.
-- 2) Ensure runtime roles have access to schema, tables, and sequences.
-- 3) Keep grants broad for this internal app to avoid recurring permission incidents.

grant usage on schema app_riskappetite to anon, authenticated, service_role;

grant all privileges on all tables in schema app_riskappetite
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_riskappetite
  to anon, authenticated, service_role;

alter default privileges in schema app_riskappetite
  grant all privileges on tables
  to anon, authenticated, service_role;

alter default privileges in schema app_riskappetite
  grant all privileges on sequences
  to anon, authenticated, service_role;
