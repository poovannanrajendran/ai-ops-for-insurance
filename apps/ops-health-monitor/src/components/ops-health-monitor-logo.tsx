import type { SVGProps } from "react";

export function OpsHealthMonitorLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect fill="url(#grad)" height="64" rx="14" width="64" />
      <path d="M16 42H48" stroke="#E2E8F0" strokeLinecap="round" strokeWidth="4" />
      <path d="M18 34L26 27L34 31L46 20" stroke="#5EEAD4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      <circle cx="26" cy="27" fill="#E2E8F0" r="2.6" />
      <circle cx="34" cy="31" fill="#E2E8F0" r="2.6" />
      <circle cx="46" cy="20" fill="#E2E8F0" r="2.6" />
      <defs>
        <linearGradient id="grad" x1="10" x2="55" y1="8" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="1" stopColor="#155E75" />
        </linearGradient>
      </defs>
    </svg>
  );
}
