# D04 — Day 4: A Lloyd's Slip Can Hide the Issue in Plain Sight

If you have ever reviewed a Market Reform Contract slip, you know the feeling.

Forty pages of structured sections, sub-limits, conditions, and exclusions. Somewhere in there is the clause that matters — the one that changes the risk profile, contradicts the submission, or introduces coverage you were not expecting.

Finding it takes experience. But getting to it takes time. And in a market where speed-to-quote matters, the first read should not take 45 minutes.

**What I built (Day 4):**
A slip reviewer. Paste or upload the MRC slip text. The tool extracts key terms — insured, class, period, limits, deductibles, territories — then flags unusual clauses, coverage gaps, and wording that deviates from standard market practice.

The output is a reviewer-ready summary: extracted terms on one side, flagged items ranked by materiality on the other.

I used public-domain sample slips for testing (sourced and attributed in the repo). The extraction works across different slip formats because it focuses on semantic structure, not template matching.

**Why this is harder than it looks:**
Slips are semi-structured. They follow MRC conventions, but every syndicate and broker has variations. Hardcoded field extraction breaks on the first non-standard slip. The AI needs to understand the intent of each section, not just its position.

This is where insurance domain knowledge matters in AI tool design. A generic document parser would miss the significance of a "claims cooperation clause" being absent, or a sub-limit being unusually low relative to the overall limit.

**Technical decisions:**
- AI extraction with structured output for key terms
- Materiality scoring for flagged items (high/medium/low)
- Side-by-side reviewer layout with source text linkage
- Schema: `app_slipreviewer` with sample attribution in `SOURCES.md`
- Supabase Data API exposure for downstream integration

**The scale path:**
Clause library comparisons. Benchmark wording checks against market standard. Endorsement awareness. Specialist routing for flagged items.

---

**CTA:** What clause type would you auto-highlight first in a real market review — unusual exclusions, sub-limit deviations, or missing standard clauses?

**Hashtags:** #LloydsMarket #SlipReview #InsuranceAI #MRC #ClauseAnalysis #Underwriting #SpecialtyInsurance

**Image prompt (Gemini):** Professional UI mockup on dark navy. Centre: split view — left panel shows slip text with highlighted sections (amber for unusual clauses, red for gaps). Right panel: extracted key terms in a clean card format with materiality badges. Top-left: "Day 4" teal badge. Bottom: "Slip Reviewer". A subtle Lloyd's building silhouette watermark in the background. 1200x628.
