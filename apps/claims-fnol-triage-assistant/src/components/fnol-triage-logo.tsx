import type { SVGProps } from "react";

export function FnolTriageLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 96 96" {...props}>
      <rect x="10" y="10" width="76" height="76" rx="24" fill="url(#fnol-bg)" />
      <path d="M30 64L44 48L54 56L70 34" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 30H48" stroke="#FDE68A" strokeWidth="4" strokeLinecap="round" />
      <path d="M30 40H42" stroke="#FDE68A" strokeWidth="4" strokeLinecap="round" />
      <circle cx="65" cy="61" r="8" fill="#F59E0B" />
      <path d="M65 57V61L68 64" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="fnol-bg" x1="16" y1="16" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F766E" />
          <stop offset="1" stopColor="#1F2937" />
        </linearGradient>
      </defs>
    </svg>
  );
}
