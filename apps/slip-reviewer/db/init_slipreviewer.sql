create schema if not exists app_slipreviewer;

create table if not exists app_slipreviewer.app_slipreviewer_analysis_runs (
  id bigserial primary key,
  request_id uuid not null unique,
  source_label text,
  raw_slip_text text not null,
  question text,
  field_coverage integer not null,
  matched_fields integer not null,
  missing_fields integer not null,
  gate_passed boolean not null,
  missing_required_fields text[] not null default '{}',
  structured_data jsonb not null,
  field_matches jsonb not null,
  unusual_clauses jsonb not null,
  coverage_gaps jsonb not null,
  commentary jsonb not null,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_slipreviewer.app_slipreviewer_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_slipreviewer_analysis_runs_created_at
  on app_slipreviewer.app_slipreviewer_analysis_runs (created_at desc);

create index if not exists idx_app_slipreviewer_audit_created_at
  on app_slipreviewer.app_slipreviewer_audit (created_at desc);

-- Required for Supabase Data API access:
-- 1) Expose schema `app_slipreviewer` in Supabase Dashboard -> API -> Data API.
-- 2) Ensure runtime roles have access to schema, tables, and sequences.
-- 3) Keep grants broad for this internal app to avoid recurring permission incidents.

grant usage on schema app_slipreviewer to anon, authenticated, service_role;

grant all privileges on all tables in schema app_slipreviewer
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_slipreviewer
  to anon, authenticated, service_role;

alter default privileges in schema app_slipreviewer
  grant all privileges on tables
  to anon, authenticated, service_role;

alter default privileges in schema app_slipreviewer
  grant all privileges on sequences
  to anon, authenticated, service_role;
