# P03 — The Nerdy Version: How Every Request Flows Through the Stack

This one is for the engineers. If you want the business-friendly version, see my previous post.

I am building 30 insurance AI apps in 30 days and shipping every one publicly. Here is exactly how the data moves through the stack — no hand-waving.

**The request lifecycle:**

```
POST /api/triage/analyse
  → Zod schema validation (reject malformed input early)
  → Service layer receives typed DTO
  → Repository checks Supabase for duplicates (idempotency)
  → AI helper calls OpenAI/Anthropic with structured prompt
  → Response parsed into deterministic output shape
  → Repository writes to app_submissiontriage.analysis_runs
  → Audit logger emits stages: request_received → analysis_completed
  → API returns { requestId, result, processingTimeMs, persistence: { status } }
```

**What makes this different from a typical AI wrapper:**

Every response includes `requestId` and `processingTimeMs`. Not optional. Not "nice to have." If I cannot trace a request from intake to persistence, I have not built a tool — I have built a toy.

Audit stages are non-blocking writes. The API does not wait for `audit.insert()` to complete before responding. But every request gets logged at `request_received`, and every outcome gets logged at `analysis_completed` or `analysis_failed`. This matters in insurance, where "when did we know" is a regulatory question.

**Schema isolation:** each app gets its own Postgres schema in Supabase. `app_slipreviewer` cannot accidentally query `app_classofbusiness`. Grants are explicit: `anon`, `authenticated`, `service_role` get only what they need.

**AI is a helper, not the product.** The service layer owns the logic. AI provides extraction, classification, or summarisation as a function call. If the AI is down, the service returns a graceful error with the validation results it already has. No black-box dependency.

**Testing:** Vitest with mocked Supabase clients and AI responses. Every critical path has a test before the implementation exists. TDD is not optional when you are shipping daily — it is the only thing that keeps you honest.

**The build I actually run:**
```bash
pnpm --filter @ai-ops/submission-triage-copilot lint
pnpm --filter @ai-ops/submission-triage-copilot test
pnpm --filter @ai-ops/submission-triage-copilot typecheck
pnpm --filter @ai-ops/submission-triage-copilot build
```

All four must pass before I push. No exceptions. No `--no-verify`.

Built with Claude Code and Codex. They write the code. I own the architecture, the domain logic, and the quality gates.

---

**CTA:** Comment "nerdy" if you want me to walk through a specific layer — schema contracts, AI prompt engineering for insurance extraction, or the audit trail design.

**Hashtags:** #AIEngineering #BuildInPublic #NextJS #Supabase #TypeScript #InsuranceAI #TDD #DataFlow

**Image prompt (Gemini):** Dark-mode code editor aesthetic. Centre: a vertical flow diagram showing the request lifecycle — each stage as a terminal/code-block style node with monospace text: "Validate → Service → AI → Persist → Audit". Connecting lines are teal (#0f766e) with small data-packet dots moving through them. Left margin: file tree showing apps/submission-triage-copilot/src/ structure. Right margin: small Supabase schema diagram. Bottom: "Every request. Traced. Audited. Persisted." in monospace white text. Logos embedded small: Next.js, TypeScript, Supabase, Vitest. 1200x628.
