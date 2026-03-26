create schema if not exists app_qbrnarrative;

grant usage on schema app_qbrnarrative to postgres, anon, authenticated, service_role;

create table if not exists app_qbrnarrative.app_qbrnarrative_analysis_runs (
  request_id uuid primary key,
  created_at timestamptz not null default now(),
  source_label text,
  qbr_text text not null,
  question text,
  summary jsonb not null,
  extracted_fields jsonb not null,
  executive_narrative jsonb not null,
  board_talking_points jsonb not null,
  prompt_hits jsonb not null,
  warnings jsonb not null,
  whitespace_rows jsonb not null,
  raw_analysis jsonb not null
);

create table if not exists app_qbrnarrative.app_qbrnarrative_audit (
  id bigint generated always as identity primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_qbrnarrative_runs_created_at
  on app_qbrnarrative.app_qbrnarrative_analysis_runs (created_at desc);

create index if not exists idx_qbrnarrative_audit_request_id
  on app_qbrnarrative.app_qbrnarrative_audit (request_id, created_at);

grant select, insert, update, delete on all tables in schema app_qbrnarrative to postgres, anon, authenticated, service_role;
grant usage, select on all sequences in schema app_qbrnarrative to postgres, anon, authenticated, service_role;
alter default privileges in schema app_qbrnarrative grant select, insert, update, delete on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema app_qbrnarrative grant usage, select on sequences to postgres, anon, authenticated, service_role;
