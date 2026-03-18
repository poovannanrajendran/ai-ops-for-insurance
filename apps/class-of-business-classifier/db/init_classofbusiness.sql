create schema if not exists app_classofbusiness;

create table if not exists app_classofbusiness.app_classofbusiness_analysis_runs (
  id bigserial primary key,
  request_id uuid not null,
  source_label text,
  raw_risk_text text not null,
  question text,
  top_label text not null,
  top_confidence numeric(5,2) not null,
  confidence_band text not null,
  ambiguous boolean not null default false,
  warnings jsonb not null default '[]'::jsonb,
  candidates jsonb not null default '[]'::jsonb,
  keyword_signals jsonb not null default '[]'::jsonb,
  commentary jsonb not null default '{}'::jsonb,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_classofbusiness.app_classofbusiness_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_classofbusiness_analysis_runs_created_at
  on app_classofbusiness.app_classofbusiness_analysis_runs (created_at desc);

create index if not exists idx_app_classofbusiness_audit_created_at
  on app_classofbusiness.app_classofbusiness_audit (created_at desc);

-- If you use Supabase Data API:
-- 1) Expose schema `app_classofbusiness` in Supabase Dashboard -> API -> Data API.
-- 2) Ensure runtime roles can access objects in this schema.

grant usage on schema app_classofbusiness to anon, authenticated, service_role;

grant all privileges on all tables in schema app_classofbusiness
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_classofbusiness
  to anon, authenticated, service_role;

alter default privileges in schema app_classofbusiness
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema app_classofbusiness
  grant all on sequences to anon, authenticated, service_role;
