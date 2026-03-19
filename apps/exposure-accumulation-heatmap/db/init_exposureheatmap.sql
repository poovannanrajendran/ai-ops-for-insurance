create schema if not exists app_exposureheatmap;

create table if not exists app_exposureheatmap.app_exposureheatmap_analysis_runs (
  id bigserial primary key,
  request_id uuid not null,
  source_label text,
  raw_csv_text text not null,
  question text,
  summary jsonb not null default '{}'::jsonb,
  hotspots jsonb not null default '[]'::jsonb,
  heat_points jsonb not null default '[]'::jsonb,
  country_concentration jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  commentary jsonb not null default '{}'::jsonb,
  query_hits jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_exposureheatmap.app_exposureheatmap_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_exposureheatmap_analysis_runs_created_at
  on app_exposureheatmap.app_exposureheatmap_analysis_runs (created_at desc);

create index if not exists idx_app_exposureheatmap_audit_created_at
  on app_exposureheatmap.app_exposureheatmap_audit (created_at desc);

grant usage on schema app_exposureheatmap to anon, authenticated, service_role;

grant all privileges on all tables in schema app_exposureheatmap
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_exposureheatmap
  to anon, authenticated, service_role;

alter default privileges in schema app_exposureheatmap
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema app_exposureheatmap
  grant all on sequences to anon, authenticated, service_role;
