# Thread Handoff - 2026-03-24

## 1) Current state snapshot
This handoff captures the latest completed work in `ai-ops-for-insurance` so a new session can resume immediately without replaying prior context.

- Branch: `main`
- Latest committed milestone in this thread:
  - `a47a10e` - docs: add codex full-access project policy
  - `e4f72ae` - docs: add original requirements baseline and day1-day14 change logs
  - `4abce95` - docs: update RAG with statcounter rollout and day 12-14 status
  - `9d76cf5` - feat: add statcounter analytics across all app layouts
  - `2c3f3f6` - feat: implement day 12-14 apps with persistence and audit

## 2) What was completed in this thread

### Day 12-14 implementation
- Built and validated:
  - Day 12 `treaty-structure-explainer`
  - Day 13 `exposure-clash-detector`
  - Day 14 `claims-leakage-flagger`
- Included deterministic services, API routes, DB init scripts, tests, samples, and production builds.

### Analytics rollout (Statcounter)
- Implemented analytics across all app root layouts (Day 1-14) using the official Next.js plugin approach.
- Shared component added:
  - `packages/common-ui/src/statcounter-analytics.tsx`
- Wired through:
  - `packages/common-ui/src/index.ts`
  - `apps/*/src/app/layout.tsx`
- Default Statcounter values currently set in shared component:
  - `project_id=13211903`
  - `security_code=72173381`
- Optional overrides supported via env:
  - `NEXT_PUBLIC_STATCOUNTER_PROJECT`
  - `NEXT_PUBLIC_STATCOUNTER_SECURITY`

### Documentation updates
- Added baseline requirements document:
  - `docs/original_requirements_full.md`
- Added per-day change logs:
  - `docs/day1_submission-triage-copilot_changes.md`
  - `docs/day2_portfolio-mix-dashboard_changes.md`
  - `docs/day3_risk-appetite-parser_changes.md`
  - `docs/day4_slip-reviewer_changes.md`
  - `docs/day5_class-of-business-classifier_changes.md`
  - `docs/day6_exposure-accumulation-heatmap_changes.md`
  - `docs/day7_cat-event-briefing_changes.md`
  - `docs/day8_policy-endorsement-diff-checker_changes.md`
  - `docs/day9_referral-priority-queue-scorer_changes.md`
  - `docs/day10_claims-fnol-triage-assistant_changes.md`
  - `docs/day11_binder-capacity-monitor_changes.md`
  - `docs/day12_treaty-structure-explainer_changes.md`
  - `docs/day13_exposure-clash-detector_changes.md`
  - `docs/day14_claims-leakage-flagger_changes.md`
- Updated RAG docs:
  - `docs/rag/critical-memory.md`
  - `docs/rag/cross-agent-rag-brief.md`

### External system sync done
- Notion: created update page for Statcounter rollout and day1-day14 URLs.
- Linear: created project document for Statcounter rollout and deployment context.

## 3) Deployment status (latest known)
All Day 1-14 apps were deployed via Vercel CLI and aliased to production URLs.

Production URLs:
1. https://submission-triage-copilot.vercel.app
2. https://portfolio-mix-dashboard.vercel.app
3. https://risk-appetite-parser.vercel.app
4. https://slip-reviewer.vercel.app
5. https://class-of-business-classifier.vercel.app
6. https://exposure-accumulation-heatmap.vercel.app
7. https://cat-event-briefing.vercel.app
8. https://policy-endorsement-diff-checker.vercel.app
9. https://referral-priority-queue-scorer.vercel.app
10. https://claims-fnol-triage-assistant.vercel.app
11. https://binder-capacity-monitor.vercel.app
12. https://treaty-structure-explainer.vercel.app
13. https://exposure-clash-detector.vercel.app
14. https://claims-leakage-flagger.vercel.app

## 4) Vercel caveat discovered and resolved
During CLI redeploys for day12-day14, projects initially failed due default project settings (`framework=Other`, `rootDirectory=.`, implicit `public` output expectation).

Resolved by patching project settings via Vercel API:
- `framework=nextjs`
- `rootDirectory=apps/<app-folder>`
- monorepo install/build commands:
  - `pnpm install --frozen-lockfile --dir ../..`
  - `pnpm --dir ../.. --filter @ai-ops/<package> build`

## 5) Repo cleanliness / local note
- Working tree currently has one untracked file:
  - `content_claude/assets/p20.png`
- Decide in next session whether to keep, commit, or remove it.

## 6) Resume checklist for next session
1. Confirm `git status` and decide treatment for `content_claude/assets/p20.png`.
2. Decide next implementation target (Day 15 onward) and create corresponding plan doc.
3. Apply standard app checklist before claiming completion:
   - deterministic API contract
   - Supabase analysis + audit tables
   - audit stage writes
   - test + typecheck + build pass
   - visual QA
4. Deploy app via CLI (if Git integration constrained) using proven Vercel settings pattern.
5. Update docs/RAG/Notion/Linear at end of milestone.

## 7) Important operating rules to carry forward
- Local port `3000` is reserved for OpenWebUI and should not be used/stopped.
- Keep UI symmetry and spacing consistency as an enforced quality rule.
- Maintain deterministic behavior and non-blocking audit logging in every app.

