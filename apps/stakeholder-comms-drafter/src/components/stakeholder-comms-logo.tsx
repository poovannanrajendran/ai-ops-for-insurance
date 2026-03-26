import type { SVGProps } from "react";

export function StakeholderCommsLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect fill="#0f5f66" height="64" rx="16" width="64" />
      <rect fill="#d8eff1" height="36" rx="8" width="44" x="10" y="14" />
      <path d="M18 42h28" stroke="#0f5f66" strokeLinecap="round" strokeWidth="3" />
      <circle cx="22" cy="26" fill="#0f5f66" r="4" />
      <rect fill="#0f5f66" height="4" rx="2" width="22" x="30" y="24" />
      <rect fill="#0f5f66" height="4" rx="2" width="16" x="30" y="32" />
    </svg>
  );
}
