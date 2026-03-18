create schema if not exists app_portfoliomix;

create table if not exists app_portfoliomix.app_portfoliomix_analysis_runs (
  id bigserial primary key,
  request_id uuid not null unique,
  source_label text,
  raw_csv_text text not null,
  total_records integer not null,
  class_distribution jsonb not null,
  territory_distribution jsonb not null,
  limit_band_distribution jsonb not null,
  currencies jsonb not null,
  warnings jsonb not null,
  commentary jsonb not null,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_portfoliomix.app_portfoliomix_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_portfoliomix_analysis_runs_created_at
  on app_portfoliomix.app_portfoliomix_analysis_runs (created_at desc);

create index if not exists idx_app_portfoliomix_audit_created_at
  on app_portfoliomix.app_portfoliomix_audit (created_at desc);

-- Required for Supabase Data API access:
-- 1) Expose schema `app_portfoliomix` in Supabase Dashboard -> API -> Data API.
-- 2) Ensure runtime roles have access to schema, tables, and sequences.

grant usage on schema app_portfoliomix to anon, authenticated, service_role;

grant all privileges on all tables in schema app_portfoliomix
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_portfoliomix
  to anon, authenticated, service_role;

alter default privileges in schema app_portfoliomix
  grant all privileges on tables
  to anon, authenticated, service_role;

alter default privileges in schema app_portfoliomix
  grant all privileges on sequences
  to anon, authenticated, service_role;
