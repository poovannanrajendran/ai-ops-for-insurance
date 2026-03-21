# D01 — Day 1: From Broker Submission to Triage Decision in Minutes

An underwriter I worked with once told me: "I spend 70% of my time on submissions I'll decline."

That stuck with me. Not because it was surprising — anyone in the London Market knows the volume problem — but because it revealed how much capacity is consumed before judgment even begins.

Day 1 of my 30-day challenge tackles this head-on.

**The problem:**
Broker submission packs arrive as inconsistent documents — different formats, missing fields, buried key terms. An experienced underwriter can scan one in 15 minutes. But they are scanning dozens per week, and most do not fit the book.

The first-pass triage is manual, repetitive, and low-signal. It is exactly the kind of work AI should handle.

**What I built:**
A submission triage copilot. Paste or upload the broker text. The tool extracts key fields — insured name, class, territory, limit, deductible — scores appetite fit against configurable criteria, and returns a clear recommendation: Accept, Refer, or Decline. With reasoning.

Every analysis is persisted to Supabase with a unique request ID. Every decision is auditable. Processing time is measured and returned in the response.

This is not a chatbot that says "this looks like property insurance." It is a structured extraction and scoring pipeline with deterministic outputs.

**The scale path:**
Multi-document ingestion. Broker workspace integration. Class-specific rule libraries. Human-in-the-loop borderline queues where the model is uncertain.

**What I learned building it:**
The hardest part was not the AI extraction. It was defining what "appetite fit" means in a way that is configurable per syndicate without becoming a rules engine. I kept it simple: weighted scoring with explicit factor breakdowns. The underwriter sees exactly why the score is what it is.

Built with Claude Code. Deployed on Vercel. Schema: `app_submissiontriage`. Live and demoable.

---

**CTA:** If you were building this for an underwriting team, what field would you want surfaced first — class, territory, or limit adequacy?

**Hashtags:** #InsuranceAI #Underwriting #LloydsMarket #RiskSelection #SubmissionTriage #AIProduct #SpecialtyInsurance

**Image prompt (Gemini):** Professional app screenshot mockup on dark navy background. Centre: a clean UI showing a submission form on the left and a triage result card on the right with "REFER" in amber, extracted fields listed, and an appetite score bar. Top-left: "Day 1" badge in teal circle. Bottom: "Submission Triage Copilot" in white text. Small app logo embedded. Style: product demo, dark theme, professional. 1200x628.
