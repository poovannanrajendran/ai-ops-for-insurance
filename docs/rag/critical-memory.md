# Critical Memory Notes

- 2026-03-16: On this Mac, port `3000` is occupied by OpenWebUI. Always run local app dev servers on port `3001`.
- 2026-03-17: Day 4 (`slip-reviewer`) uses schema `app_slipreviewer`; expose schema in Supabase Data API and apply `apps/slip-reviewer/db/init_slipreviewer.sql` before expecting stored persistence.
- 2026-03-17: Day 4 demo samples include public-source attribution in `apps/slip-reviewer/samples/SOURCES.md`; keep this pattern for future public-domain sample ingestion.
- 2026-03-18: Port `3000` is reserved for OpenWebUI and must not be stopped, reassigned, or used by day-app dev servers. Use other ports (for example `3001`, `3005`) for local app testing.
- 2026-03-18: Day 5 (`class-of-business-classifier`) is live at `https://class-of-business-classifier.vercel.app` with schema `app_classofbusiness`; verify Data API exposure and use schema profile headers for direct REST checks.
- 2026-03-19: Day 6 (`exposure-accumulation-heatmap`) local dev/test runs on port `3006`; keep port `3000` untouched for OpenWebUI.
- 2026-03-19: Day 6 map uses real basemap geometry from `world-atlas` and applies capped auto-zoom to location clusters for readable but still global context.
- 2026-03-20: A complete LinkedIn content pack (32 posts, images, app screenshots, and short animations) is generated under `content/` with UK-English copy. Master browser page: `content/index.html`.
- 2026-03-20: Publishing sequence decision: launch burst includes `P01`, `P02`, `P03`, `P04`, `P08`, `D01` on 2026-03-20, followed by daily `D02..D10`; section start/wrap posts inserted around related bucket runs.
