create schema if not exists app_meetingprep;

create table if not exists app_meetingprep.app_meetingprep_analysis_runs (
  id bigserial primary key,
  request_id uuid not null unique,
  source_label text,
  briefing_text text not null,
  question text,
  summary jsonb not null,
  context_overview jsonb not null default '[]'::jsonb,
  stakeholder_map jsonb not null default '[]'::jsonb,
  risk_cues jsonb not null default '[]'::jsonb,
  talking_points jsonb not null default '[]'::jsonb,
  open_questions jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  query_hits jsonb not null default '[]'::jsonb,
  whitespace_rows jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists app_meetingprep.app_meetingprep_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_meetingprep_analysis_runs_created_at
  on app_meetingprep.app_meetingprep_analysis_runs (created_at desc);

create index if not exists idx_app_meetingprep_audit_created_at
  on app_meetingprep.app_meetingprep_audit (created_at desc);

grant usage on schema app_meetingprep to anon, authenticated, service_role;

grant all privileges on all tables in schema app_meetingprep
  to anon, authenticated, service_role;

grant all privileges on all sequences in schema app_meetingprep
  to anon, authenticated, service_role;

alter default privileges in schema app_meetingprep
  grant all on tables to anon, authenticated, service_role;

alter default privileges in schema app_meetingprep
  grant all on sequences to anon, authenticated, service_role;
