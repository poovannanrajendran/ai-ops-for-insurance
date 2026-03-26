create schema if not exists app_renewalcopilot;

create table if not exists app_renewalcopilot.app_renewalcopilot_analysis_runs (
  id bigserial primary key,
  request_id uuid not null unique,
  source_label text,
  renewal_text text not null,
  question text,
  summary jsonb not null,
  strategy_memo jsonb not null default '[]'::jsonb,
  negotiation_talking_points jsonb not null default '[]'::jsonb,
  pricing_signals jsonb not null default '[]'::jsonb,
  action_plan jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  query_hits jsonb not null default '[]'::jsonb,
  whitespace_rows jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_renewalcopilot.app_renewalcopilot_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_renewalcopilot_analysis_runs_created_at
  on app_renewalcopilot.app_renewalcopilot_analysis_runs (created_at desc);

create index if not exists idx_app_renewalcopilot_audit_created_at
  on app_renewalcopilot.app_renewalcopilot_audit (created_at desc);

grant usage on schema app_renewalcopilot to anon, authenticated, service_role;

grant all privileges on all tables in schema app_renewalcopilot
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_renewalcopilot
  to anon, authenticated, service_role;

alter default privileges in schema app_renewalcopilot
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema app_renewalcopilot
  grant all on sequences to anon, authenticated, service_role;
