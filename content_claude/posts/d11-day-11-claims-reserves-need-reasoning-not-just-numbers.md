# D11 — Day 11: A Reserve Number Without Reasoning Is Just a Guess with Authority

"Set initial reserve at $750K."

Every claims handler has written a sentence like this. But the real question the file reviewer asks is: why $750K and not $500K or $1.2M?

Initial reserves are judgment calls. They combine loss description, coverage terms, historical precedent, and a sense of where the claim is likely to land. Experienced handlers do this instinctively. Newer handlers do it inconsistently. And neither group typically documents the reasoning in a way that survives the first reserve review.

**What I built (Day 11):**
A claims reserve advisor. Enter the structured claim details — loss type, estimated value, coverage indicators, territory, claimant history. The tool suggests an initial reserve range with reasoning: which factors pushed the estimate up, which pulled it down, and what synthetic precedents (based on similar claim profiles) support the recommendation.

This is not a pricing model. It is a reasoning framework. The reserve is still the handler's decision. But now the decision has documented logic behind it.

**Why "synthetic precedents" instead of real claims data:**
I do not have access to claims triangles or loss databases for this challenge. So the tool generates precedent reasoning based on claim profile similarity — "Claims of this type in this territory with similar complexity typically settle in the $600K-$900K range based on industry patterns."

In a production deployment, this would connect to actual historical claims data. The architecture supports it. The demo shows the pattern.

**Why this matters for Lloyd's:**
Reserve adequacy is a governance issue. Lloyd's performance management reviews reserve movements. Documenting the initial reasoning creates an audit trail that supports later reviews — not just "what was the reserve" but "why was it set there."

**Technical details:**
- Structured claim intake with severity and complexity scoring
- Reserve range suggestion with factor-level reasoning
- Synthetic precedent generation based on claim profile
- Full persistence with audit trail
- Schema: `app_claimsreserve`

---

**CTA:** Should initial reserve suggestions come with confidence bands or point estimates? I think the answer reveals how your team thinks about uncertainty.

**Hashtags:** #ClaimsOps #Reserves #InsuranceAI #ClaimsManagement #LloydsMarket #RiskOps #Governance

**Image prompt (Gemini):** Dark navy background. Centre: a reserve recommendation card showing "$600K - $900K" as a range with a central estimate marked. Below: a factor breakdown showing upward arrows (complexity, territory risk) and downward arrows (clean loss history, standard coverage) influencing the range. Right side: a precedent summary card. Top-left: "Day 11" teal badge. Bottom: "Claims Reserve Advisor". Professional actuarial aesthetic. 1200x628.
