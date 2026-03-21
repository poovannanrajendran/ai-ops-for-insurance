# P11 — Ten Lessons from Ten Days: Speed Comes from Standards, Not Shortcuts

I shipped 11 insurance AI apps in 10 days. Here is what actually worked, what did not, and what I would tell someone starting a similar challenge.

**1. Your Day 0 determines your Day 15.**
The monorepo scaffold, shared packages, and deployment template I built before writing any business logic saved more time than any individual optimisation. Front-load the infrastructure investment.

**2. Four quality gates, no exceptions.**
`lint`, `test`, `typecheck`, `build`. Every push. The gates caught 6 bugs that would have reached production. The 30 seconds they add per push save hours of debugging.

**3. Audit trails are not optional in insurance.**
Every app writes structured audit stages. This is not logging for developers — it is evidence for compliance. "When did the system receive this request? What decision did it make? When was the result persisted?" These questions will be asked.

**4. AI should be a helper function, not the architecture.**
The service layer owns the logic. AI provides extraction, classification, or summarisation as a function call. When the AI service is slow or down, the app degrades gracefully instead of failing completely.

**5. Supabase schema isolation prevents cross-contamination.**
Each app gets its own schema. This was a Day 0 decision that I never regretted. When Day 6's heatmap had a schema migration issue, it did not affect Day 5's classifier.

**6. UK English is a discipline, not a preference.**
When your audience is the London Market, "standardise" is not optional. I caught myself writing "optimize" four times in the first three days. Set it in the linter and forget it.

**7. Port 3000 is always taken.**
On my machine, OpenWebUI lives on port 3000. Every app that defaulted to 3000 conflicted. Small lesson, repeated pain. Now every app gets an explicit port.

**8. Claude Code and Codex are genuine engineering partners.**
They write the code. I own the architecture, domain decisions, and quality gates. This division of labour is not hypothetical — it is how all 11 apps were built. The AI handles implementation velocity. I handle design judgment.

**9. The hardest problems are domain problems, not technical ones.**
How should a submission triage score work? What makes an endorsement change "material"? When should a referral queue override FIFO? These questions require insurance expertise, not better prompts.

**10. Ship daily or the backlog wins.**
The cadence is the constraint. If I did not ship today, tomorrow has two apps to build. That pressure forces clarity: scope down, focus on the MVP, and trust the scale path for later.

---

**CTA:** Which of these resonates most with how your team builds? I will keep sharing what works and what breaks as the challenge continues.

**Hashtags:** #LessonsLearned #OperatingModel #InsuranceTechnology #BuildInPublic #AI #EngineeringLeadership #Productivity

**Image prompt (Gemini):** Dark navy background. Centre: a numbered list (1-10) with each lesson as a short one-line summary, arranged in two columns of 5. Key numbers highlighted in teal: "6 bugs caught", "11 apps", "10 days". Title at top: "10 Lessons. 10 Days. 11 Apps." Bottom: a subtle progress bar showing completion. Clean typography, professional, no illustrations. 1200x628.
