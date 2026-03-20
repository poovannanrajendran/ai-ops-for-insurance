export const demoSamples = [
  {
    id: "critical-mixed-queue",
    label: "Critical mixed queue",
    description: "High urgency queue with sanctions, missing fields, and short time-to-bind pressure.",
    sourceLabel: "critical-mixed-queue.tsv",
    question: "Which referrals need immediate escalation and why?",
    queueText: `referral_id\tinsured_name\tclass_of_business\tterritory\tquoted_premium_gbp\ttiv_gbp\tloss_ratio_pct\tdays_to_inception\tmissing_fields_count\tnew_business\tclaims_activity\tsanctions_flag\treferral_reason\tbroker_tier
RQ-901\tNorthshore Tank Storage\tProperty\tUnited Kingdom\t285000\t78000000\t96\t4\t3\ttrue\ttrue\tfalse\tcapacity reduction and aggregate pressure\tSilver
RQ-902\tOrion Trade Holdings\tMarine Cargo\tUAE; Saudi Arabia\t140000\t24000000\t72\t9\t5\ttrue\tfalse\tfalse\tnew territory and bespoke wording request\tBronze
RQ-903\tBaltic Components Group\tCasualty\tPoland; Germany\t92000\t12000000\t38\t21\t1\tfalse\tfalse\tfalse\tloss record clarification pending\tGold
RQ-904\tAtlas Engineering LLC\tEnergy\tKazakhstan\t410000\t95000000\t88\t6\t4\ttrue\ttrue\ttrue\tsanctions screening hit and claims deterioration\tSilver`
  },
  {
    id: "moderate-renewal-queue",
    label: "Moderate renewal queue",
    description: "Mostly orderly renewals with one higher-priority item for reviewer triage.",
    sourceLabel: "moderate-renewal-queue.tsv",
    question: "What can be fast-tracked and what needs review?",
    queueText: `referral_id\tinsured_name\tclass_of_business\tterritory\tquoted_premium_gbp\ttiv_gbp\tloss_ratio_pct\tdays_to_inception\tmissing_fields_count\tnew_business\tclaims_activity\tsanctions_flag\treferral_reason\tbroker_tier
RQ-411\tHarbour Foods Distribution\tProperty\tUnited Kingdom\t98000\t14000000\t42\t34\t1\tfalse\tfalse\tfalse\trenewal premium change above authority\tGold
RQ-412\tWillow Care Services\tCasualty\tIreland\t76000\t6000000\t28\t41\t0\tfalse\tfalse\tfalse\tminor wording clarification\tGold
RQ-413\tDeltawave Retail Group\tCyber\tFrance; Belgium\t118000\t9000000\t63\t16\t2\tfalse\ttrue\tfalse\tclaims activity and ransomware controls question\tSilver
RQ-414\tAster Marine Logistics\tMarine Cargo\tNetherlands\t88000\t10000000\t36\t28\t1\tfalse\tfalse\tfalse\tterritorial extension sign-off\tGold`
  },
  {
    id: "missing-required-gate",
    label: "Missing required gate",
    description: "Intentionally incomplete dataset to trigger Day 9 validation handling.",
    sourceLabel: "missing-required-gate.tsv",
    question: "Which items need escalation?",
    queueText: `referral_id\tinsured_name\tclass_of_business\nRQ-001\tShort Example\tProperty`
  }
] as const;
