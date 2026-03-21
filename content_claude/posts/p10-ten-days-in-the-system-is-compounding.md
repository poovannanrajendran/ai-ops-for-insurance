# P10 — Ten Days In: The System Is Compounding

Day 1 took an entire weekend.

Day 10 shipped in under four hours — including tests, deployment, database setup, and visual QA.

That is not because the apps got simpler. Day 10 (FNOL triage with dual-mode intake) was more complex than Day 1 (submission triage). It shipped faster because the platform was doing its job.

Here is what compounded between Day 3 and Day 10:

**Deterministic response contracts.**
Every API now returns the same shape: `{ requestId, result, processingTimeMs, persistence: { status, runId } }`. No guessing. No app-specific quirks. The frontend knows exactly what to expect. Testing is standardised.

**Audit trail consistency.**
Four stages, same order, every app: `request_received` → `validation_failed` (if applicable) → `analysis_completed` or `analysis_failed`. Non-blocking writes. I can trace any request across any app with the same query pattern.

**Shared UI patterns.**
By Day 5, the intake form layout was stable: symmetric left/right labels, consistent spacing, responsive without custom breakpoints. By Day 8, I stopped designing forms and started assembling them from existing components.

**Predeploy checks.**
A script that verifies Supabase schema exposure, Vercel environment variables, and build output before deployment. This eliminated the "deployed but broken" class of failures entirely.

**The numbers:**
- Setup time per app: 3 hours (Day 1) → 45 minutes (Day 10)
- Time to first working API route: 2 hours → 25 minutes
- Deployment failures: 4 in first 3 days → 0 in last 7 days
- Test coverage on critical paths: consistent across all 10 apps

**What changed in my workflow:**
Early days: I was debugging infrastructure problems.
Day 10: I am debugging domain logic — the actual hard part.

That shift is the whole point. When the platform works, the energy goes into the problem space. I am spending my time understanding how FNOL triage should work in a Lloyd's claims team, not fighting with build configurations.

**The tools helping me ship:**
Claude Code handles the implementation. Codex helps with architecture decisions and boilerplate. I own the domain logic, the quality gates, and the deployment decisions.

One person. Two AI agents. Ten apps shipped and deployed. Twenty more to go.

---

**CTA:** If you want speed without chaos, standardise the hard parts early. What did you standardise that changed your build velocity?

**Hashtags:** #DigitalTransformation #EngineeringLeadership #BuildInPublic #InsuranceAI #AIOps #Productivity #CompoundingGains

**Image prompt (Gemini):** Dark navy background. Centre: two side-by-side metric cards — "Day 1: 14 hours" and "Day 10: 4 hours" with a downward arrow between them. Below: a horizontal progress bar showing 10 of 30 apps completed, each as a small teal square. Right side: a stacked list of improvements: "Deterministic contracts ✓", "Audit consistency ✓", "Shared UI ✓", "Predeploy checks ✓". Title: "The System Is Compounding." 1200x628.
