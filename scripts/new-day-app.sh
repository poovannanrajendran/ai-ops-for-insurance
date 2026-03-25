#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -lt 4 ] || [ "$#" -gt 5 ]; then
  echo "Usage: $0 <day-number> <app-folder> <short-name> <display-name> [port]"
  echo "Example: $0 12 treaty-renewal-tracker treatyrenewal \"Treaty Renewal Tracker\" 3012"
  exit 1
fi

DAY_NUM="$1"
APP_FOLDER="$2"
SHORT_NAME="$3"
DISPLAY_NAME="$4"
PORT="${5:-30${DAY_NUM}}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$REPO_ROOT/apps/$APP_FOLDER"
PKG_NAME="@ai-ops/$APP_FOLDER"
SCHEMA_NAME="app_${SHORT_NAME}"
INIT_SQL_NAME="init_${SHORT_NAME}.sql"
DOC_PLAN="$REPO_ROOT/docs/day-${DAY_NUM}-execution-plan.md"

if [ -e "$APP_DIR" ]; then
  echo "❌ App folder already exists: $APP_DIR"
  exit 1
fi

mkdir -p "$APP_DIR"/db "$APP_DIR"/samples "$APP_DIR"/src/app/api/$SHORT_NAME/analyze "$APP_DIR"/src/app "$APP_DIR"/src/services "$APP_DIR"/tests

cat > "$APP_DIR/.gitignore" <<'EOF'
.next
node_modules
.vercel
EOF

cat > "$APP_DIR/package.json" <<EOF
{
  "name": "$PKG_NAME",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --port $PORT",
    "build": "next build",
    "start": "next start --port $PORT",
    "lint": "pnpm exec eslint .",
    "typecheck": "tsc --project tsconfig.json",
    "test": "vitest run"
  },
  "dependencies": {
    "@ai-ops/common-ui": "workspace:*",
    "@ai-ops/config": "workspace:*",
    "@ai-ops/lib": "workspace:*",
    "next": "16.1.6",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.1",
    "@types/node": "^25.5.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "postcss": "^8.5.8",
    "tailwindcss": "^4.2.1",
    "typescript": "^5.9.3",
    "vitest": "^4.1.0"
  }
}
EOF

cat > "$APP_DIR/next.config.ts" <<'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
EOF

cat > "$APP_DIR/postcss.config.mjs" <<'EOF'
export default {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};
EOF

cat > "$APP_DIR/tsconfig.json" <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["node", "vitest/globals"],
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    "tests/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
EOF

cat > "$APP_DIR/next-env.d.ts" <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited.
EOF

cat > "$APP_DIR/vercel.json" <<EOF
{
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile --dir ../..",
  "buildCommand": "pnpm --dir ../.. --filter $PKG_NAME build"
}
EOF

cat > "$APP_DIR/src/app/layout.tsx" <<EOF
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "$DISPLAY_NAME",
  description: "Day $DAY_NUM app in AI Ops for Insurance"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

cat > "$APP_DIR/src/app/globals.css" <<'EOF'
@import "tailwindcss";

:root {
  --page-bg: #e8eef3;
  --page-ink: #0f172a;
  --accent: #0f5f66;
  --accent-soft: #dbeff0;
  --accent-strong: #0b3b47;
  --panel-subtle: rgba(255, 255, 255, 0.82);
  --panel-border: rgba(71, 85, 105, 0.18);
  --hero-border: rgba(255, 255, 255, 0.72);
}

* {
  box-sizing: border-box;
}

html {
  background:
    radial-gradient(circle at top left, rgba(15, 95, 102, 0.14), transparent 26%),
    radial-gradient(circle at top right, rgba(30, 64, 175, 0.12), transparent 24%),
    linear-gradient(180deg, #f4f7fa 0%, var(--page-bg) 100%);
}

body {
  margin: 0;
  color: var(--page-ink);
  font-family:
    "Avenir Next",
    "Segoe UI",
    "Helvetica Neue",
    Helvetica,
    Arial,
    sans-serif;
  min-height: 100vh;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.44), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(15, 23, 42, 0));
}

button,
input,
textarea {
  font: inherit;
}
EOF

cat > "$APP_DIR/src/app/page.tsx" <<EOF
export default function Page() {
  return (
    <main style={{ padding: 24 }}>
      <h1>$DISPLAY_NAME</h1>
      <p>Day $DAY_NUM scaffold created. Implement intake, analysis route, and result cards with symmetric layout.</p>
    </main>
  );
}
EOF

cat > "$APP_DIR/src/app/icon.svg" <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none">
  <rect x="8" y="8" width="80" height="80" rx="24" fill="#0F766E"/>
  <path d="M30 48h36M48 30v36" stroke="#ECFEFF" stroke-width="6" stroke-linecap="round"/>
</svg>
EOF

cat > "$APP_DIR/src/services/analyze-$SHORT_NAME.ts" <<EOF
export interface ${SHORT_NAME^}Insight {
  summary: string;
  queryHits: string[];
}

export function analyze${SHORT_NAME^}(inputText: string, question?: string): {
  missing: string[];
  insight: ${SHORT_NAME^}Insight;
} {
  const missing = inputText.trim().length < 80 ? ["inputText"] : [];
  const trimmedQuestion = question?.trim() ?? "";
  const queryHits = trimmedQuestion
    ? inputText
        .split(/[\r\n]+/)
        .filter((line) => line.toLowerCase().includes(trimmedQuestion.toLowerCase()))
        .slice(0, 3)
    : [];

  return {
    missing,
    insight: {
      summary: missing.length > 0 ? "Input too short for deterministic analysis." : "Scaffold analysis passed.",
      queryHits
    }
  };
}
EOF

cat > "$APP_DIR/src/app/api/$SHORT_NAME/analyze/route.ts" <<EOF
import { NextResponse } from "next/server";
import { z } from "zod";

import { analyze${SHORT_NAME^} } from "@/services/analyze-$SHORT_NAME";

const requestSchema = z.object({
  inputText: z.string().min(10, "Provide input text."),
  sourceLabel: z.string().max(160).optional(),
  question: z.string().max(280).optional()
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
  }

  const { missing, insight } = analyze${SHORT_NAME^}(parsed.data.inputText, parsed.data.question);
  if (missing.length > 0) {
    return NextResponse.json({ error: "Missing required fields: inputText." }, { status: 400 });
  }

  return NextResponse.json({
    requestId,
    analysis: insight,
    processingTimeMs: Date.now() - startedAt,
    persistence: { status: "skipped", reason: "Implement Supabase persistence and audit stages." }
  });
}
EOF

cat > "$APP_DIR/tests/analyze-$SHORT_NAME.test.ts" <<EOF
import { describe, expect, test } from "vitest";

import { analyze${SHORT_NAME^} } from "@/services/analyze-$SHORT_NAME";

describe("analyze${SHORT_NAME^}", () => {
  test("returns insight for valid input (positive case)", () => {
    const result = analyze${SHORT_NAME^}(
      "This scaffold input is intentionally long enough to pass the required deterministic minimum length gate for analysis."
    );

    expect(result.missing).toEqual([]);
    expect(result.insight.summary).toContain("passed");
  });

  test("returns missing field when input is too short (negative case)", () => {
    const result = analyze${SHORT_NAME^}("short input");
    expect(result.missing).toContain("inputText");
  });
});
EOF

cat > "$APP_DIR/tests/analyze-route.test.ts" <<EOF
import { describe, expect, test } from "vitest";

import { POST } from "@/app/api/$SHORT_NAME/analyze/route";

describe("POST /api/$SHORT_NAME/analyze", () => {
  test("returns 200 for valid payload (positive case)", async () => {
    const response = await POST(
      new Request("http://localhost:$PORT/api/$SHORT_NAME/analyze", {
        method: "POST",
        body: JSON.stringify({
          inputText:
            "This scaffold request payload is intentionally long enough to pass deterministic validation and return a successful analysis response.",
          sourceLabel: "sample.txt"
        })
      })
    );

    expect(response.status).toBe(200);
  });

  test("returns 400 for invalid payload (negative case)", async () => {
    const response = await POST(
      new Request("http://localhost:$PORT/api/$SHORT_NAME/analyze", {
        method: "POST",
        body: JSON.stringify({
          inputText: "short"
        })
      })
    );

    expect(response.status).toBe(400);
  });
});
EOF

cat > "$APP_DIR/samples/SOURCES.md" <<'EOF'
# Sources

- Add public-domain sample source URLs and access dates.
EOF

cat > "$APP_DIR/db/$INIT_SQL_NAME" <<EOF
create schema if not exists $SCHEMA_NAME;

create table if not exists $SCHEMA_NAME.${SCHEMA_NAME}_analysis_runs (
  id bigint generated by default as identity primary key,
  request_id uuid not null unique,
  source_label text,
  raw_input text not null,
  question text,
  summary jsonb not null default '{}'::jsonb,
  raw_analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists $SCHEMA_NAME.${SCHEMA_NAME}_audit (
  id bigint generated by default as identity primary key,
  request_id uuid not null,
  stage text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_${SCHEMA_NAME}_analysis_runs_created_at
  on $SCHEMA_NAME.${SCHEMA_NAME}_analysis_runs (created_at desc);

create index if not exists idx_${SCHEMA_NAME}_audit_created_at
  on $SCHEMA_NAME.${SCHEMA_NAME}_audit (created_at desc);

grant usage on schema $SCHEMA_NAME to anon, authenticated, service_role;
grant all privileges on all tables in schema $SCHEMA_NAME to anon, authenticated, service_role;
grant all privileges on all sequences in schema $SCHEMA_NAME to anon, authenticated, service_role;
alter default privileges in schema $SCHEMA_NAME grant all on tables to anon, authenticated, service_role;
alter default privileges in schema $SCHEMA_NAME grant all on sequences to anon, authenticated, service_role;
EOF

cat > "$APP_DIR/README.md" <<EOF
# $DISPLAY_NAME (Day $DAY_NUM)

## Local dev

\`\`\`bash
pnpm --filter $PKG_NAME dev
\`\`\`

## Database bootstrap

Run:

\`\`\`sql
-- file: apps/$APP_FOLDER/db/$INIT_SQL_NAME
\`\`\`

Then expose schema in Supabase Data API:
- $SCHEMA_NAME

## Next steps

- Wire app metadata in \`packages/config/src/apps.ts\`
- Implement analyzer + Zod contract
- Implement non-blocking audit logging stages
- Pass lint/test/typecheck/build
- Run full QA gate:
  - \`pnpm qa:app $APP_FOLDER $PKG_NAME $PORT\`
EOF

if [ ! -f "$DOC_PLAN" ]; then
  cat > "$DOC_PLAN" <<EOF
# Day $DAY_NUM Execution Plan

## Objective
- Build and ship **$DISPLAY_NAME**.

## Scope
- Deterministic analyzer with required-field gate.
- Supabase persistence and audit logging.
- Symmetric UI/UX and visual QA.

## Deliverables
- App in \`apps/$APP_FOLDER\`
- DB init in \`apps/$APP_FOLDER/db/$INIT_SQL_NAME\`
- Vercel deploy + smoke verification
EOF
fi

echo "✅ Scaffold created: $APP_DIR"
echo "Next actions:"
echo "1) Add metadata in packages/config/src/apps.ts"
echo "2) Add deploy alias in package.json (deploy:day$DAY_NUM)"
echo "3) Run: bash scripts/predeploy-check.sh $APP_FOLDER"
echo "4) Run: pnpm qa:app $APP_FOLDER $PKG_NAME $PORT"
