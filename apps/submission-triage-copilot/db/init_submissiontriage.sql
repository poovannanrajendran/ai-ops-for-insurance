create schema if not exists app_submissiontriage;

create table if not exists app_submissiontriage.app_submissiontriage_core (
  id bigserial primary key,
  request_id uuid not null unique,
  submitted_text text not null,
  insured_name text,
  broker_contact text,
  headquarters text,
  attachment text,
  business text,
  revenue text,
  employees text,
  locations text,
  construction text,
  occupancy text,
  fire_protection text,
  nat_cat text,
  risk_controls text,
  claims_history text,
  loss_history text,
  expiring_carrier text,
  expiring_premium text,
  desired_inception text,
  broker_objective text,
  notes text,
  class_of_business text not null,
  territory text not null,
  currency text,
  limit_amount numeric,
  decision text not null,
  confidence numeric not null,
  rationale jsonb not null,
  extracted_fields jsonb,
  raw_analysis jsonb not null,
  created_at timestamptz not null default now()
);

alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists insured_name text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists broker_contact text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists headquarters text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists attachment text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists business text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists revenue text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists employees text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists locations text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists construction text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists occupancy text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists fire_protection text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists nat_cat text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists risk_controls text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists claims_history text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists loss_history text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists expiring_carrier text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists expiring_premium text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists desired_inception text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists broker_objective text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists notes text;
alter table if exists app_submissiontriage.app_submissiontriage_core
  add column if not exists extracted_fields jsonb;

create table if not exists app_submissiontriage.app_submissiontriage_audit (
  id bigserial primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
