import type { SVGProps } from "react";

export function WordingRiskDiffLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <rect x="10" y="10" width="44" height="44" rx="14" fill="#0F766E" opacity="0.14" />
      <path d="M18 20H31" stroke="#153348" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M18 29H38" stroke="#153348" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M18 38H32" stroke="#153348" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M41 18V46" stroke="#0F766E" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M36 25L46 35" stroke="#0F766E" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M46 25L36 35" stroke="#B45309" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="45" cy="43" r="4" fill="#B91C1C" />
    </svg>
  );
}
