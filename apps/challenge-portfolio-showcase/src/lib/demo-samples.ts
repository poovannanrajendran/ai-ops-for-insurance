export interface DemoSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  showcaseText: string;
  question: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "milestone-pack",
    label: "Milestone pack",
    description: "Strong evidence-led update for the first 30-day challenge milestone.",
    sourceLabel: "milestone-pack.txt",
    showcaseText:
      "challenge_name=30 Useful Insurance and Productivity Apps\napps_completed=29\ndomain_coverage=Underwriting, claims, exposure, placement, productivity\noutcomes=Live apps deployed with deterministic extraction and audit trails\ndeployment_status=Most apps live on Vercel with Supabase persistence\nevidence_links=GitHub commits, Vercel URLs, QA logs\nnext_focus=Final day launch and consolidated portfolio page\nstory_hook=From idea to 30 production-grade insurance AI tools in one month\nstrength_1=Consistent UI/UX and governance controls\nstrength_2=Automated quality gates and visual checks\nnext_1=Publish final Day 30 showcase\nnext_2=Package reusable framework for future cohorts",
    question: "What should be highlighted in the final launch narrative?"
  },
  {
    id: "partial-evidence",
    label: "Partial evidence",
    description: "Portfolio summary with gaps in deployment evidence and blocker tracking.",
    sourceLabel: "partial-evidence.txt",
    showcaseText:
      "challenge_name=Insurance AI Build Sprint\napps_completed=24\ndomain_coverage=Underwriting and claims\noutcomes=Strong prototypes with limited production rollout\ndeployment_status=Partial deployment across environments\nevidence_links=TBD\nnext_focus=Stabilise deployment and improve documentation\nstory_hook=Rapid progress with remaining hardening work\nblocker_1=Missing production evidence links\nblocker_2=Inconsistent deployment scripts\nnext_1=Consolidate rollout checklist",
    question: "What are the main credibility gaps to close before publication?"
  },
  {
    id: "missing-required",
    label: "Missing required gate",
    description: "Intentionally incomplete payload to trigger validation gate.",
    sourceLabel: "missing-required-showcase.txt",
    showcaseText:
      "challenge_name=\napps_completed=\noutcomes=Draft only",
    question: "Can this be published as the final portfolio view?"
  }
];
