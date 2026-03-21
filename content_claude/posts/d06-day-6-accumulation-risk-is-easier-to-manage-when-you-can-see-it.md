# D06 — Day 6: The Spreadsheet Said $200M Exposure. The Map Said "All in One Postcode."

This is a real pattern I have seen.

A portfolio report shows total insured value by territory. The numbers look fine — well within tolerance. But when you plot the actual insured locations on a map, three-quarters of the exposure sits within a 15-mile radius. One flood event, one windstorm corridor, and the "diversified" portfolio is anything but.

Spreadsheet totals hide spatial concentration. Maps reveal it.

**What I built (Day 6):**
An exposure accumulation heatmap. Upload a CSV with insured locations and TIV (total insured value). The tool validates locations, geocodes where needed, aggregates by grid cell, and renders an interactive heatmap showing where value is clustering.

Hotspots glow. Warnings fire when a grid cell exceeds configurable thresholds. And the AI adds commentary: "Southeast England accounts for 34% of total TIV. The top three postcodes contain $180M of combined exposure, exceeding the stated tolerance by $45M."

The map uses real world geometry from the `world-atlas` package — not a flat image with dots on it. It auto-zooms to the cluster area while keeping global context visible. This matters when you are presenting to a board that needs both detail and perspective.

**Why this is an exposure management tool, not a mapping tool:**
The value is not in the map. The value is in the warnings. A pretty visualisation without threshold logic is a screensaver. This tool tells you where you are over-accumulated and by how much.

**Technical decisions:**
- CSV intake with flexible column mapping for location and TIV fields
- Real basemap geometry with capped auto-zoom to clusters
- Configurable accumulation thresholds per grid resolution
- AI-generated exposure commentary
- Schema: `app_exposureheatmap` with audit trail
- Local dev on port 3006 (port 3000 reserved for other services)

**The scale path:**
Multi-peril overlays (flood zones, earthquake fault lines, wind corridors). Cat scenario layering. Near-real-time surveillance connected to binding feeds.

---

**CTA:** What would make this production-ready first for your team: better location validation, higher map fidelity, or scenario overlays?

**Hashtags:** #ExposureManagement #AccumulationRisk #GeoAnalytics #InsuranceTech #Heatmap #LloydsMarket #CatRisk

**Image prompt (Gemini):** Dark navy background with a glowing interactive map of the UK/Europe in the centre. Heatmap overlay showing orange-red hotspots in Southeast England and a cluster in the Netherlands. Right side: a warning card showing "SE England: 34% of TIV — OVER THRESHOLD" in amber. Bottom-left: TIV summary statistics. Top-left: "Day 6" teal badge. Bottom: "Exposure Accumulation Heatmap". Style: geo-analytics dashboard, professional. 1200x628.
