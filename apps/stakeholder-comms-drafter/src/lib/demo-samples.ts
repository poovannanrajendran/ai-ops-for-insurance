export interface DemoSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  commsText: string;
  question: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "board-update",
    label: "Board update",
    description: "Complete update for board stakeholders with clear action owners.",
    sourceLabel: "board-update-pack.txt",
    commsText:
      "comms_type=Board Update\naudience=Executive Committee\ntone=Formal\nsubject=Q2 underwriting and claims controls update\ncontext=Quarter close delivered with improved referral handling and stable loss ratio trend.\nmessage_1=Referral queue age reduced by 21% versus last quarter.\nmessage_2=Claims leakage indicators remain below threshold for all major lines.\nmessage_3=Two remediation actions are on track ahead of regulatory checkpoint.\naction_1=Approve hiring of one underwriting analyst in marine line.\naction_2=Endorse control attestation pack for audit committee review.",
    question: "What should be emphasised in the executive comms?"
  },
  {
    id: "incident-note",
    label: "Incident briefing",
    description: "Sensitive operational message that needs careful framing and follow-up actions.",
    sourceLabel: "incident-briefing-pack.txt",
    commsText:
      "comms_type=Incident Briefing\naudience=Operations Leadership\ntone=Measured\nsubject=System outage impact on referral triage\ncontext=Outage affected queue processing for three hours across two teams.\nmessage_1=Backlog increased by 64 items with temporary SLA pressure.\nmessage_2=No data integrity loss detected after restoration checks.\nmessage_3=Temporary reassignment plan is active until queue normalises.\naction_1=Confirm overtime approval for two shifts tonight.\naction_2=Issue client-facing status note by 16:00.",
    question: "Draft a message suitable for leadership and immediate operations response."
  },
  {
    id: "missing-required",
    label: "Missing required gate",
    description: "Incomplete payload to trigger required-field validation.",
    sourceLabel: "missing-required-comms.txt",
    commsText: "comms_type=\naudience=Operations\nsubject=\nmessage_1=Draft only",
    question: "Can we publish this now?"
  }
];
