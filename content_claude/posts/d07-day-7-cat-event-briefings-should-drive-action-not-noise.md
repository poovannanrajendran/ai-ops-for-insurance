# D07 — Day 7: When a Cat Event Breaks, Your Team Needs a Briefing — Not a News Feed

Hurricane makes landfall. Earthquake in Turkey. Flooding across Northern Europe.

Within hours, every reinsurer and syndicate is scrambling for the same information: What classes are impacted? What is the estimated loss range? Which territories are affected? What should we do right now?

The information exists — spread across news feeds, vendor bulletins, cat model outputs, and internal exposure reports. But assembling it into a coherent briefing that a CUO can act on? That takes hours. Sometimes days.

By then, the first 48 hours — when decisions matter most — have already passed.

**What I built (Day 7):**
A cat event briefing tool. Enter the event details — type, location, severity. The tool classifies the event, estimates likely impacted classes of business, generates preliminary loss bands, identifies affected territories, and outputs a concise action list.

Not a prediction engine. Not a cat model replacement. A first-response briefing that gives the underwriting team a structured starting point within minutes instead of hours.

The output includes:
- Event classification and severity estimate
- Impacted classes ranked by likely exposure
- Territory mapping with world heatmap visualisation
- Suggested immediate actions (exposure checks, reserve flags, communication triggers)
- Full audit trail in Supabase

**Why the heatmap matters:**
A text-only briefing says "impacts Southeast US." A heatmap shows exactly which grid cells in your portfolio overlap with the event footprint. It connects the external event to your internal exposure data.

I integrated a world heatmap with the event's affected area highlighted. It is not RMS or AIR precision — it is operational context for the first conversation.

**What I learned:**
The hardest design decision was scope. A cat briefing tool could try to be everything — live feeds, model integration, multi-event tracking. I kept it focused on the first briefing. Speed of initial response is the bottleneck, not long-term tracking.

---

**CTA:** Should a cat briefing tool optimise for speed, depth, or strict one-page format? I think the answer depends on who reads it first.

**Hashtags:** #CatRisk #ExposureManagement #InsuranceAnalytics #EventBriefing #RiskOps #LloydsMarket #Reinsurance

**Image prompt (Gemini):** Dark navy background. Centre: a briefing document card with sections: "Event: Hurricane — Cat 4", "Impacted Classes", "Loss Estimate: $2-5B", "Actions". To the right: a small world map with a highlighted region (Gulf of Mexico) glowing amber/red. Top-left: "Day 7" teal badge. Bottom: "Cat Event Briefing". Professional, operations-room aesthetic. 1200x628.
