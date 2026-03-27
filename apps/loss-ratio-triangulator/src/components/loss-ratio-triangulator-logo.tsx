import type { SVGProps } from "react";

export function LossRatioTriangulatorLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 96 96" {...props}>
      <rect x="10" y="10" width="76" height="76" rx="24" fill="url(#triangle-bg)" />
      <path d="M25 70L48 28L71 70H25Z" fill="white" fillOpacity="0.95" />
      <path d="M32 62H64" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 54H60" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 46H56" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
      <circle cx="71" cy="30" r="7" fill="#818CF8" />
      <defs>
        <linearGradient id="triangle-bg" x1="16" y1="16" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E1B4B" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>
    </svg>
  );
}
