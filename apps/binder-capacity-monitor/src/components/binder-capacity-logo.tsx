import type { SVGProps } from "react";

export function BinderCapacityLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 96 96" {...props}>
      <rect x="10" y="10" width="76" height="76" rx="24" fill="url(#binder-bg)" />
      <path d="M28 62H68" stroke="#D1FAE5" strokeWidth="4" strokeLinecap="round" />
      <path d="M34 62V42" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <path d="M48 62V30" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <path d="M62 62V22" stroke="#5EEAD4" strokeWidth="6" strokeLinecap="round" />
      <circle cx="62" cy="22" r="8" fill="#F59E0B" />
      <defs>
        <linearGradient id="binder-bg" x1="16" y1="16" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F766E" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
