import type { SVGProps } from "react";

export function DataQualityValidatorLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect fill="url(#grad)" height="64" rx="14" width="64" />
      <path d="M18 18H46V46H18V18Z" stroke="#E2E8F0" strokeWidth="3.5" />
      <path d="M23 28H39" stroke="#5EEAD4" strokeLinecap="round" strokeWidth="3.5" />
      <path d="M23 36H34" stroke="#E2E8F0" strokeLinecap="round" strokeWidth="3.5" />
      <circle cx="42" cy="36" fill="#FCD34D" r="4" />
      <defs>
        <linearGradient id="grad" x1="10" x2="55" y1="8" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="1" stopColor="#115E59" />
        </linearGradient>
      </defs>
    </svg>
  );
}
