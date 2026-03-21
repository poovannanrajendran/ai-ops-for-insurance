import { StatCounter } from "@statcounter/nextjs";

interface StatcounterAnalyticsProps {
  project: string;
  security: string;
}

const DEFAULT_PROJECT_ID = 13211903;
const DEFAULT_SECURITY_CODE = "72173381";

function toProjectId(value: string): number {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10);
  }
  return DEFAULT_PROJECT_ID;
}

export function StatcounterAnalytics({ project, security }: StatcounterAnalyticsProps) {
  const projectId = toProjectId(project);
  const securityCode = security.trim() || DEFAULT_SECURITY_CODE;

  return <StatCounter project_id={projectId} security_code={securityCode} />;
}
