import type { SVGProps } from "react";

type LogoProps = SVGProps<SVGSVGElement>;

export function ExposureScenarioLogo(props: LogoProps) {
  return (
    <svg fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="8" y="10" width="48" height="44" rx="14" fill="#FFF4D8" />
      <path d="M18 43.5L28 33.5L36 38L46 22.5" stroke="#B45309" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      <circle cx="18" cy="43.5" r="3" fill="#7C2D12" />
      <circle cx="28" cy="33.5" r="3" fill="#7C2D12" />
      <circle cx="36" cy="38" r="3" fill="#7C2D12" />
      <circle cx="46" cy="22.5" r="3" fill="#7C2D12" />
      <path d="M18 20H30" stroke="#D97706" strokeLinecap="round" strokeWidth="3" />
      <path d="M18 26H26" stroke="#D97706" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}
