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

create index if not exists idx_app_portfoliomix_analysis_runs_created_at
  on app_portfoliomix.app_portfoliomix_analysis_runs (created_at desc);
