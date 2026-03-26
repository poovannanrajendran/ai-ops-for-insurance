import type { SVGProps } from "react";

export function SanctionsScreeningAidLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect fill="url(#grad)" height="64" rx="14" width="64" />
      <circle cx="26" cy="26" fill="#E2E8F0" r="9" />
      <path d="M34 34L44 44" stroke="#FCA5A5" strokeLinecap="round" strokeWidth="4" />
      <circle cx="44" cy="44" r="9" stroke="#FCA5A5" strokeWidth="4" />
      <defs>
        <linearGradient id="grad" x1="10" x2="55" y1="8" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="1" stopColor="#115E59" />
        </linearGradient>
      </defs>
    </svg>
  );
}
