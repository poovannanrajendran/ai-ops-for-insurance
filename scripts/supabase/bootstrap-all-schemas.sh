#!/usr/bin/env bash
set -euo pipefail

APPS=(
  "submission-triage-copilot"
  "portfolio-mix-dashboard"
  "risk-appetite-parser"
  "slip-reviewer"
  "class-of-business-classifier"
  "exposure-accumulation-heatmap"
  "cat-event-briefing"
  "policy-endorsement-diff-checker"
  "referral-priority-queue-scorer"
  "claims-fnol-triage-assistant"
  "binder-capacity-monitor"
  "treaty-structure-explainer"
  "exposure-clash-detector"
  "claims-leakage-flagger"
)

for app in "${APPS[@]}"; do
  echo
  echo "============================================================"
  echo "Bootstrapping: ${app}"
  echo "============================================================"
  ./scripts/supabase/bootstrap-schema.sh "${app}"
done

echo
echo "All app schemas bootstrapped and Data API-verified."

