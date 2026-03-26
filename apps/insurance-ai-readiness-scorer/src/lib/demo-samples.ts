export interface DemoSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  assessmentText: string;
  question: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "scaling-programme",
    label: "Scaling programme",
    description: "Clear sponsor, governance, and phased AI adoption plan.",
    sourceLabel: "scaling-programme.txt",
    assessmentText:
      "sponsor=COO and CUO joint sponsorship\ntarget_domains=Underwriting triage, claims leakage, exposure management\ndata_foundation=Curated warehouse with daily refresh and API access\ngovernance=Quarterly AI oversight board with control owners\noperating_model=Central AI enablement with domain product owners\ntooling=Prompt gateway, model eval pipeline, and observability dashboards\nskills=Two ML engineers, four analytics product leads, underwriter champions\nuse_case_1=Referral queue prioritisation\nstrength_1=Executive sponsorship is active\nstrength_2=Production data contracts in place\nblocker_1=Inconsistent playbook adoption across regional teams\nplan_1=Standardise risk controls in all live apps\nplan_2=Launch AI enablement academy for underwriters",
    question: "What should leadership prioritise in the next quarter?"
  },
  {
    id: "foundational-gap",
    label: "Foundational gap",
    description: "Limited governance and fragmented tooling requiring strong sequencing.",
    sourceLabel: "foundational-gap.txt",
    assessmentText:
      "sponsor=Head of Operations\ntarget_domains=Claims and policy operations\ndata_foundation=Manual extracts from multiple systems\ngovernance=None documented yet\noperating_model=Ad-hoc pilots inside business teams\ntooling=Basic workflow scripts only\nskills=One analyst with limited AI delivery experience\nuse_case_1=Claims triage support\nblocker_1=No formal governance owner\nblocker_2=Data quality checks not standardised\nblocker_3=Pilot outcomes not tied to business KPIs\nplan_1=Nominate governance owner and control cadence\nplan_2=Define baseline KPI scorecard for pilots",
    question: "What is the minimum plan to move from pilot to controlled rollout?"
  },
  {
    id: "missing-gate",
    label: "Missing required gate",
    description: "Intentionally incomplete payload to trigger validation gate.",
    sourceLabel: "missing-required-readiness.txt",
    assessmentText:
      "sponsor=\ntarget_domains=Claims only\ndata_foundation=\ngovernance=\nuse_case_1=Draft only",
    question: "Can we score this now?"
  }
];

