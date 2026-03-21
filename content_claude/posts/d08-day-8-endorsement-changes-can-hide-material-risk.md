# D08 — Day 8: The Renewal Looked Identical Until I Diffed the Endorsement

Renewal season. The slip comes back marked "as expiring." The broker says nothing has changed.

Then six months later, a claim is declined because a sub-limit was halved in the endorsement. Or a territory exclusion was added that nobody flagged. Or a cooperation clause was quietly removed.

I have seen this pattern destroy client relationships. Not because anyone was dishonest — but because endorsement comparison is manual, tedious, and happens under time pressure.

**The problem in plain terms:**
Policy endorsements modify the original wording. At renewal, you need to compare the expiring terms against the renewal terms. The differences can be subtle — a single word change ("shall" to "may"), a limit reduction buried in a schedule, an exclusion added to a sub-section.

Manual comparison catches the obvious changes and misses the material ones.

**What I built (Day 8):**
A policy endorsement diff checker. Paste the expiring wording and the renewal wording. The tool compares them section by section, flags every material change, and classifies each by severity: Critical, Major, Minor, Cosmetic.

The output is an executive brief — not a raw diff. "Three material changes detected. The most significant is a 40% reduction in the cyber sub-limit from $5M to $3M, which may affect coverage adequacy for the insured's stated digital revenue exposure."

That is the sentence that should reach the underwriter. Not a red-and-green text diff that requires 20 minutes of interpretation.

**Technical decisions:**
- Semantic comparison, not character-level diff
- Severity classification for every change detected
- Executive summary generated from the change analysis
- Full audit trail with both versions stored
- Schema: `app_endorsementdiff`

**Why this crosses team boundaries:**
This tool is useful for underwriters reviewing renewals, brokers preparing submission narratives, and claims teams checking coverage at the point of notification. The same diff engine serves three different users.

---

**CTA:** Where would this save the most time in your organisation: underwriting renewals, broking placement, or claims coverage review?

**Hashtags:** #PolicyWordings #Renewals #InsuranceAI #Endorsements #RiskReview #LloydsMarket #ClauseAnalysis

**Image prompt (Gemini):** Dark navy background. Centre: two document panels side by side — "Expiring" on left, "Renewal" on right — with highlighted diff sections. Amber highlights for material changes, red for critical. Between them: a severity summary card showing "3 Critical, 5 Major, 12 Minor". Top-left: "Day 8" teal badge. Bottom: "Endorsement Diff Checker". Professional, legal-document aesthetic. 1200x628.
