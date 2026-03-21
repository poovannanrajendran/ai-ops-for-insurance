# D03 — Day 3: Your Risk Appetite Document Is Probably Useless to Your Systems

Every syndicate has a risk appetite statement. Most of them are PDFs that sit in SharePoint.

They say things like "We will consider property risks in Western Europe with limits up to $50M, excluding flood in Zone A territories." Perfectly clear to a human underwriter who has been in the market for a decade. Completely opaque to any system trying to enforce it.

The result: appetite drift. Underwriters interpret the boundaries differently. Referrals happen inconsistently. And nobody notices until the portfolio review reveals risks that should never have been written.

**What I built (Day 3):**
A risk appetite parser. Upload or paste the appetite statement — PDF or plain text. The tool extracts structured rules: classes of business, territories, limit ranges, exclusions, and conditions. It returns them in a queryable format with a Q&A interface.

Ask it: "Do we write marine cargo in Southeast Asia above $10M?" and it returns a structured answer with the source text that supports the decision.

This is not about replacing underwriting judgment. It is about making the appetite boundaries explicit, consistent, and available at the point of decision.

**Why this matters for the London Market:**
Lloyd's Blueprint Two and the broader market reform agenda push towards more structured, machine-readable data flows. Risk appetite is a foundational layer. If your appetite is not structured, your triage cannot be consistent, and your portfolio steering is based on assumptions rather than rules.

**Technical notes:**
- LLM-powered extraction with structured output schemas
- RAG-style Q&A over the parsed appetite document
- Versioning support for tracking appetite changes over time
- Schema: `app_riskappetite` with full audit trail

**The scale path:**
Versioned appetite knowledge base with approval workflows. Automatic sync to triage scoring (Day 1's copilot). Change tracking and diff alerts when appetite is updated.

---

**CTA:** How do you manage appetite drift today — manually, with a rules layer, or not at all? Honest answers only.

**Hashtags:** #RiskAppetite #Underwriting #InsuranceTech #LloydsMarket #LLM #Governance #Blueprint2 #AIOps

**Image prompt (Gemini):** Before/after split design on dark navy. Left side: a blurry PDF document icon with "Risk Appetite Statement" title, looking analog and inaccessible. Right side: the same content as a clean structured table with columns for Class, Territory, Limit, Exclusions — crisp, digital, queryable. Arrow connecting them labelled "Parse". Top-left: "Day 3" teal badge. Bottom: "Risk Appetite Parser". 1200x628.
