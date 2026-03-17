import type { SVGProps } from "react";

type LogoProps = SVGProps<SVGSVGElement>;

export function AppGroupLogo(props: LogoProps) {
  return (
    <svg fill="none" viewBox="0 0 96 96" {...props}>
      <rect x="8" y="8" width="80" height="80" rx="24" fill="url(#group-bg)" />
      <path
        d="M48 22L68 30V46C68 58 59.6 68.8 48 72C36.4 68.8 28 58 28 46V30L48 22Z"
        fill="white"
        fillOpacity="0.96"
      />
      <path
        d="M38 47H58M48 37V57M63 24L72 24M24 63L33 63M24 24L31 31M65 65L72 72"
        stroke="#0F766E"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="72" cy="24" r="5" fill="#14B8A6" />
      <circle cx="24" cy="63" r="5" fill="#0F766E" />
      <circle cx="72" cy="72" r="5" fill="#99F6E4" />
      <defs>
        <linearGradient id="group-bg" x1="14" y1="12" x2="84" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function SubmissionTriageLogo(props: LogoProps) {
  return (
    <svg fill="none" viewBox="0 0 96 96" {...props}>
      <rect x="10" y="10" width="76" height="76" rx="24" fill="url(#submission-bg)" />
      <rect x="28" y="24" width="40" height="48" rx="10" fill="white" fillOpacity="0.96" />
      <path d="M36 38H60M36 48H60M36 58H50" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M58 60L63 65L72 53"
        stroke="#0F766E"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="submission-bg" x1="16" y1="16" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E293B" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PortfolioMixLogo(props: LogoProps) {
  return (
    <svg fill="none" viewBox="0 0 96 96" {...props}>
      <rect x="10" y="10" width="76" height="76" rx="24" fill="url(#portfolio-bg)" />
      <path d="M28 66V34" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <path d="M48 66V26" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <path d="M68 66V42" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <path d="M24 66H72" stroke="#D1FAE5" strokeWidth="4" strokeLinecap="round" />
      <defs>
        <linearGradient id="portfolio-bg" x1="16" y1="16" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F766E" />
          <stop offset="1" stopColor="#164E63" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function RiskAppetiteLogo(props: LogoProps) {
  return (
    <svg fill="none" viewBox="0 0 96 96" {...props}>
      <rect x="10" y="10" width="76" height="76" rx="24" fill="url(#riskappetite-bg)" />
      <path
        d="M31 31H65V65H31V31Z"
        stroke="white"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M38 42H58" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 50H54" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 58H49" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M58 58L62 62L69 54" stroke="#99F6E4" strokeWidth="4" strokeLinecap="round" />
      <defs>
        <linearGradient id="riskappetite-bg" x1="16" y1="16" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F766E" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
