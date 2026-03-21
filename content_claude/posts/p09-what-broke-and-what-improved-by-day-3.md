# P09 — What Broke and What I Fixed by Day 3

Three days in. Three apps shipped. And a growing list of things that nearly derailed each one.

Building at pace is a stress test for your infrastructure. Every shortcut you took on Day 0 shows up as a blocker on Day 3. Here is what I learned.

**Lesson 1: Supabase schema exposure is not automatic.**
I created the schemas. I created the tables. I granted permissions. The API returned empty results. Why? Because Supabase requires you to explicitly expose custom schemas in the Data API settings. This is not in the quick-start guide. It cost me 90 minutes on Day 1.

Fix: added schema exposure to the Day 0 checklist. Now it is step 3 of every new app setup.

**Lesson 2: Vercel's output directory trap.**
The default Vercel settings for Next.js expect the output in a specific location. In a monorepo with pnpm workspaces, the build output path is different. The deploy succeeded but served a blank page.

Fix: leave the output directory empty in Vercel settings. Let Next.js handle it. Documented in the deployment template.

**Lesson 3: Sharp (image processing) needs an explicit pnpm allowlist.**
Next.js uses Sharp for image optimisation. In a pnpm workspace, Sharp's native binaries are not hoisted by default. The build fails silently with a fallback to squoosh, which does not work on Vercel.

Fix: added `sharp` to the pnpm `allowedDeprecatedVersions` and ensured it is in the workspace root dependencies.

**Lesson 4: The quality gates saved me twice already.**
On Day 2, I pushed code that passed `build` but failed `typecheck`. The type error was in a response shape that would have produced incorrect dashboard data. On Day 3, `lint` caught a missing error boundary that would have crashed the appetite parser on malformed input.

Four gates. Every push. No exceptions. This is not bureaucracy — it is insurance against myself.

**The pattern emerging:**
Every fix became a checklist item. Every checklist item prevented the same failure in the next app. By Day 3, the setup time for a new app dropped from 3 hours to 45 minutes.

Compounding discipline beats compounding shortcuts.

---

**CTA:** What guardrail gave your team the highest leverage early in a build cycle?

**Hashtags:** #BuildInPublic #LessonsLearned #InsuranceInnovation #DeliveryExcellence #Supabase #NextJS #DevOps

**Image prompt (Gemini):** Dark navy background. Centre: a timeline showing Days 1-3 with bug/fix icons at each day — red bug icon paired with green fix icon. Each pair has a one-line label: "Schema exposure", "Output directory", "Sharp allowlist". Bottom: a downward-sloping line graph labelled "Setup time per app" showing 3h → 2h → 45min. Top-left: "Days 1-3" teal badge. Bottom: "What Broke. What I Fixed." 1200x628.
