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
    description: "Clear sponsor, governance, and a richer phased AI adoption roadmap across underwriting and claims.",
    sourceLabel: "scaling-programme.txt",
    assessmentText:
      "sponsor=COO and CUO joint sponsorship\ntarget_domains=Underwriting triage, claims leakage, exposure management, regulatory operations\ndata_foundation=Curated warehouse with daily refresh, governed semantic layer, and API access\ngovernance=Quarterly AI oversight board with control owners and monthly model risk review\noperating_model=Central AI enablement office with domain product owners and local implementation leads\ntooling=Prompt gateway, model eval pipeline, observability dashboards, and incident response playbooks\nskills=Two ML engineers, four analytics product leads, underwriter champions, and claims SMEs embedded in squads\nuse_case_1=Referral queue prioritisation\nstrength_1=Executive sponsorship is active with explicit quarterly funding commitments\nstrength_2=Production data contracts in place with named data owners for each critical feed\nstrength_3=Model evaluation framework is running before each release with regression checkpoints\nstrength_4=Controls library already mapped to underwriting and claims workflows\nblocker_1=Inconsistent playbook adoption across regional teams\nblocker_2=Escalation thresholds differ between London and regional operations\nplan_1=Standardise risk controls in all live apps\nplan_2=Launch AI enablement academy for underwriters\nplan_3=Publish a single operating playbook with role-level RACI and control checkpoints\nplan_4=Introduce monthly cross-region scorecards for adoption, quality, and cycle-time outcomes",
    question: "What should leadership prioritise in the next quarter?"
  },
  {
    id: "foundational-gap",
    label: "Foundational gap",
    description: "Limited governance and fragmented tooling requiring stronger sequencing and remediation depth.",
    sourceLabel: "foundational-gap.txt",
    assessmentText:
      "sponsor=Head of Operations\ntarget_domains=Claims and policy operations\ndata_foundation=Manual extracts from multiple systems and inconsistent field definitions\ngovernance=None documented yet\noperating_model=Ad-hoc pilots inside business teams with no central dependency management\ntooling=Basic workflow scripts only and no central prompt/version registry\nskills=One analyst with limited AI delivery experience and no dedicated model validation support\nuse_case_1=Claims triage support\nstrength_1=Local teams are willing to trial deterministic automation where controls are clear\nblocker_1=No formal governance owner\nblocker_2=Data quality checks not standardised\nblocker_3=Pilot outcomes not tied to business KPIs\nblocker_4=No release approval workflow for prompt or model changes\nblocker_5=Runbooks are incomplete for incident response and rollback\nplan_1=Nominate governance owner and control cadence\nplan_2=Define baseline KPI scorecard for pilots\nplan_3=Create a central prompt and model change register with approval checkpoints\nplan_4=Implement mandatory pre-release validation gates for high-impact workflows\nplan_5=Stand up fortnightly remediation review with senior operations leadership",
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
