import type { SVGProps } from "react";

export function RegulatoryUpdateDigestLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect fill="#0F766E" height="52" rx="14" width="52" x="6" y="6" />
      <path d="M18 20h28v24H18z" fill="#CCFBF1" opacity="0.9" rx="6" />
      <path d="M23 27h18M23 33h18M23 39h10" stroke="#115E59" strokeLinecap="round" strokeWidth="2.6" />
      <circle cx="47" cy="18" fill="#F59E0B" r="6" stroke="#FDE68A" strokeWidth="2" />
    </svg>
  );
}
