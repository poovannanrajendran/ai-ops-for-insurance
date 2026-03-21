# P02 — The Architecture That Makes 30 Apps Feel Like One System

Most AI demos die because they were built to impress, not to maintain.

I learned this the hard way across 19 years of insurance technology — from Guidewire migrations to BI platforms to modern cloud builds. The demo works. The handoff fails. Six months later, nobody can deploy a fix without rebuilding the whole thing.

So when I designed the architecture for 30 insurance AI apps, I started with one question: what would make app number 30 as fast to build as app number 3?

The answer: a monorepo with shared bones and strict boundaries.

Here is how it works in plain terms:

**One repository, thirty apps.** Every app lives under `apps/` with its own UI, API routes, and database schema. But they all share the same utility packages — logging, Supabase client, AI helpers, and UI components. Change the shared logger once, every app benefits.

**Data flows in a straight line.** Upload or API request → validation → service logic → AI extraction where needed → structured response → persistence → audit log. No spaghetti. No hidden side effects.

**Every app writes to its own Supabase schema.** Schema `app_submissiontriage` does not touch `app_slipreviewer`. Clean isolation, shared infrastructure.

**Deployment is identical every time.** Vercel picks up the app folder, runs the workspace build command, and deploys. Same environment variables, same pattern, every day.

This is not clever architecture. It is deliberately boring architecture — and that is the point.

When you are shipping daily, you cannot afford to re-solve infrastructure problems. The architecture should disappear so the domain logic can be the focus.

The result: by Day 7, a new app from scaffold to deployed took under 90 minutes. Not because I cut corners, but because the platform did its job.

---

**CTA:** If you were reviewing this architecture for a production insurance team, where would you pressure-test it first?

**Hashtags:** #SoftwareArchitecture #InsuranceAI #NextJS #Supabase #Monorepo #TypeScript #AIOps #EngineeringLeadership

**Image prompt (Gemini):** Professional architecture diagram on dark navy background. Centre: a horizontal pipeline showing five connected nodes labelled "Request → Validate → Service → AI → Persist" with clean white lines and teal (#0f766e) node circles. Above: "apps/" folder icon fanning out to 30 mini app cards. Below: three shared package boxes labelled "lib", "common-ui", "config". Bottom banner: "One Platform. Thirty Apps." Logos embedded: Next.js, TypeScript, Supabase, Vercel — small, in a row at bottom. Style: technical but accessible, dark theme, no stock photos. 1200x628.
