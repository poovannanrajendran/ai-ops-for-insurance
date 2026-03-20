create schema if not exists app_referralqueuescorer;

create table if not exists app_referralqueuescorer.app_referralqueuescorer_analysis_runs (
  id bigserial primary key,
  request_id uuid not null unique,
  source_label text,
  raw_queue_text text not null,
  question text,
  summary jsonb not null,
  ranked_referrals jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  top_drivers jsonb not null default '[]'::jsonb,
  query_hits jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_referralqueuescorer.app_referralqueuescorer_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_referralqueuescorer_analysis_runs_created_at
  on app_referralqueuescorer.app_referralqueuescorer_analysis_runs (created_at desc);

create index if not exists idx_app_referralqueuescorer_audit_created_at
  on app_referralqueuescorer.app_referralqueuescorer_audit (created_at desc);

grant usage on schema app_referralqueuescorer to anon, authenticated, service_role;

grant all privileges on all tables in schema app_referralqueuescorer
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_referralqueuescorer
  to anon, authenticated, service_role;

alter default privileges in schema app_referralqueuescorer
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema app_referralqueuescorer
  grant all on sequences to anon, authenticated, service_role;
