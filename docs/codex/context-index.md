# Codex Context Index (Tier 2 and Tier 3)

Last updated: 2026-03-25

## How to use
1. Read `docs/codex/context-core.md` first.
2. Only load sections relevant to the current task.
3. Do not load full historical docs unless blocked.

## Tier 2: Task-relevant docs (load on demand)
- Build and QA standards:
  - `docs/app-build-quality-checklist.md`
  - `docs/day-app-dod-checklist.md`
  - `docs/lessons-learned.md`
  - `docs/post-day14-improvements.md`
- Day plans:
  - `docs/day-12-execution-plan.md`
  - `docs/day-13-execution-plan.md`
  - `docs/day-14-execution-plan.md`
  - `docs/day-15-execution-plan.md`
  - `docs/day-16-execution-plan.md`
  - `docs/day-17-execution-plan.md`
  - `docs/day-18-execution-plan.md`
  - `docs/day-19-execution-plan.md`
- Persistence and infra:
  - `docs/supabase-bootstrap-and-data-api.md`
  - `docs/rag/operating-model.md`
- Current handoff:
  - `docs/handoffs/thread-handoff-2026-03-24.md`

## Tier 3: Reference-only (avoid loading unless required)
- Baseline and full roadmap:
  - `docs/original_requirements_full.md`
  - `docs/30-topics-30-day-challenge-roadmap-v4-final.md`
- Per-day change logs:
  - `docs/day*_*.md`
- Social media content packs:
  - `docs/rag/linkedin-posts-day10-launch-pack.md`
- Profiles / PDFs / archived artifacts

## Recommended minimal file set by task type
- Bug fix in one app:
  - `docs/codex/context-core.md`
  - app-local files only
  - latest handoff
- New day implementation:
  - `docs/codex/context-core.md`
  - `docs/day-app-dod-checklist.md`
  - relevant day execution plan
  - `docs/lessons-learned.md`
- Deployment / Supabase issue:
  - `docs/codex/context-core.md`
  - `docs/supabase-bootstrap-and-data-api.md`
  - `scripts/supabase/*`
