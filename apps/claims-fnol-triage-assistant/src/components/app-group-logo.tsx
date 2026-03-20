import type { SVGProps } from "react";

export function AppGroupLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 96 96" {...props}>
      <rect x="8" y="8" width="80" height="80" rx="24" fill="url(#app-group-bg)" />
      <path d="M31 31H65V65H31V31Z" stroke="white" strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M48 23V73" stroke="#A7F3D0" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M23 48H73" stroke="#A7F3D0" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="48" cy="48" r="10" fill="#FDE68A" stroke="#111827" strokeWidth="3.5" />
      <defs>
        <linearGradient id="app-group-bg" x1="12" y1="12" x2="84" y2="84" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F766E" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
