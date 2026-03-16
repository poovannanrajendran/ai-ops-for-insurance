\set ON_ERROR_STOP on

SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'rag_db_user', :'rag_db_password')
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_roles
  WHERE rolname = :'rag_db_user'
)\gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'rag_db_name', :'rag_db_user')
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_database
  WHERE datname = :'rag_db_name'
)\gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', :'rag_db_name', :'rag_db_user')\gexec

\connect :rag_db_name

SELECT format('CREATE SCHEMA IF NOT EXISTS %I AUTHORIZATION %I', :'rag_schema', :'rag_db_user')\gexec
SELECT format('ALTER ROLE %I IN DATABASE %I SET search_path = %I, public', :'rag_db_user', :'rag_db_name', :'rag_schema')\gexec

SET search_path TO :rag_schema, public;

CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  project_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  source_root TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  project_key TEXT NOT NULL REFERENCES projects(project_key) ON DELETE CASCADE,
  source_path TEXT NOT NULL,
  source_type TEXT NOT NULL,
  checksum_sha256 TEXT,
  title TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_key, source_path)
);

CREATE TABLE IF NOT EXISTS chunks (
  id BIGSERIAL PRIMARY KEY,
  project_key TEXT NOT NULL REFERENCES projects(project_key) ON DELETE CASCADE,
  document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS query_log (
  id BIGSERIAL PRIMARY KEY,
  project_key TEXT,
  query TEXT NOT NULL,
  top_k INTEGER,
  retrieval_mode TEXT,
  response_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_project_key ON documents(project_key);
CREATE INDEX IF NOT EXISTS idx_chunks_project_key ON chunks(project_key);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_query_log_project_key_created_at ON query_log(project_key, created_at DESC);

SELECT format('GRANT USAGE ON SCHEMA %I TO %I', :'rag_schema', :'rag_db_user')\gexec
SELECT format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', :'rag_schema', :'rag_db_user')\gexec
SELECT format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO %I', :'rag_schema', :'rag_db_user')\gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I', :'rag_schema', :'rag_db_user')\gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO %I', :'rag_schema', :'rag_db_user')\gexec
