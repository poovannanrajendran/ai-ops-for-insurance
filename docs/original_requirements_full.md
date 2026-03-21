# Original Requirements - 30-Day Insurance AI Challenge

Last updated: 2026-03-21

## 1. Objective
Build 30 practical, demo-ready insurance AI applications in 30 days, each solving a distinct real-world workflow problem across underwriting, exposure management, claims, broking, productivity, leadership, and compliance.

## 2. Business Outcomes
- Reduce manual triage and review time for underwriters, claims handlers, and operations users.
- Standardise first-pass analysis quality across submissions, slips, endorsements, and claims events.
- Provide deterministic, explainable outputs suitable for reviewer sign-off.
- Produce portfolio evidence of product delivery, architecture consistency, and engineering discipline.

## 3. Functional Requirements (Original Baseline)
### 3.1 Day-App Model
- One app per day, independently deployable.
- Each app must support:
  - Source intake (paste/upload/sample)
  - Deterministic analysis endpoint
  - Structured results and commentary
  - Optional prompt/query match snippets

### 3.2 API Contract
Every analysis route should return:
- `requestId`
- `processingTimeMs`
- `analysis` payload
- `persistence` object with status (`stored` / `failed` / `skipped`) and reason when relevant.

### 3.3 Data Persistence
Each app requires a dedicated Supabase schema:
- `app_<shortname>`

Minimum tables per app:
- `app_<shortname>_analysis_runs`
- `app_<shortname>_audit`

### 3.4 Audit Logging Stages
All apps should write non-blocking audit events for:
- `request_received`
- `validation_failed`
- `analysis_completed`
- `analysis_failed`

### 3.5 UI/UX Baseline
- Symmetric two-column intake and source text areas.
- Consistent section rhythm: intake, summary, warnings/findings, commentary/query.
- Mobile-responsive layout.
- Clear error handling for validation and persistence states.

### 3.6 Testing Baseline
Per app:
- Unit tests for core parsing/analysis logic.
- Route tests for HTTP contract and error paths.
- Typecheck pass.
- Production build pass.

### 3.7 Deployment Baseline
- One Vercel project per app.
- Monorepo-aware settings:
  - Root Directory: `apps/<app-folder>`
  - Build command: `pnpm --dir ../.. --filter @ai-ops/<app-package> build`
  - Install command: `pnpm install --frozen-lockfile --dir ../..`
  - Framework: Next.js

### 3.8 Operations Baseline
- Keep local port `3000` reserved for OpenWebUI.
- Use app-specific alternate ports for local development.
- Maintain docs, RAG memory, and handoff updates at each milestone.

## 4. Non-Functional Requirements
- Deterministic business logic over opaque AI-only decisions.
- Fast demoability (2-3 minutes end-to-end walkthrough).
- Explainability and reviewer trust.
- Production-safe fallbacks for missing credentials/config.
- Compatibility with Vercel Hobby constraints.

## 5. Shared Architecture Requirements
- Stack: Next.js 16.1.6, React 19.2.4, TypeScript 5.9.3, Tailwind 4.2.1.
- Shared packages:
  - `@ai-ops/config`
  - `@ai-ops/lib`
  - `@ai-ops/common-ui`
- Centralised environment handling and schema metadata.
- Reusable patterns for route persistence and audit writes.

## 6. Initial Scope Delivered (Day 1-14)
- Day 1: Submission Triage Copilot
- Day 2: Portfolio Mix Dashboard
- Day 3: Risk Appetite Parser
- Day 4: Slip Reviewer
- Day 5: Class of Business Classifier
- Day 6: Exposure Accumulation Heatmap
- Day 7: Cat Event Briefing
- Day 8: Policy Endorsement Diff Checker
- Day 9: Referral Priority Queue Scorer
- Day 10: Claims FNOL Triage Assistant
- Day 11: Binder Capacity Monitor
- Day 12: Treaty Structure Explainer
- Day 13: Exposure Clash Detector
- Day 14: Claims Leakage Flagger

## 7. Cross-Cutting Enhancements Added Over Time
- Visual symmetry and spacing refinements across apps.
- Stronger Vercel monorepo configuration standards.
- Improved Supabase Data API guidance and diagnostics.
- Realistic sample sets and source attribution pattern.
- Statcounter analytics rollout across all live apps.

## 8. Acceptance Criteria (Original + Enforced)
An app is complete when:
- Deterministic analysis works for happy path and validation failures.
- Persistence and audit are functioning (or gracefully skipped with explicit reason).
- UI is symmetric, clear, and mobile-safe.
- Tests, typecheck, and build pass.
- App is deployed and reachable on its Vercel production URL.
