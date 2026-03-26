import type { SVGProps } from "react";

export function MeetingPrepBriefingLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect fill="#0F766E" height="52" rx="14" width="52" x="6" y="6" />
      <rect fill="#E0F2FE" height="24" rx="6" width="28" x="18" y="20" />
      <path d="M22 28h20M22 34h14" stroke="#0F766E" strokeLinecap="round" strokeWidth="2.6" />
      <circle cx="46" cy="18" fill="#F59E0B" r="5" />
    </svg>
  );
}
