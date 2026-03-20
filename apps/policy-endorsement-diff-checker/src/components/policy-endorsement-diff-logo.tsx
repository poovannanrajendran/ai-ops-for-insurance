export function PolicyEndorsementDiffLogo({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <rect fill="url(#day8-bg)" height="76" rx="24" width="76" x="10" y="10" />
      <path d="M26 28H52" stroke="white" strokeLinecap="round" strokeWidth="4" />
      <path d="M26 42H46" stroke="white" strokeLinecap="round" strokeWidth="4" />
      <path d="M26 56H44" stroke="white" strokeLinecap="round" strokeWidth="4" />
      <path d="M56 30L70 44L58 58" stroke="#FDE68A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      <circle cx="70" cy="62" fill="#F59E0B" r="6" />
      <defs>
        <linearGradient gradientUnits="userSpaceOnUse" id="day8-bg" x1="16" x2="80" y1="16" y2="80">
          <stop stopColor="#1E293B" />
          <stop offset="1" stopColor="#8A5B14" />
        </linearGradient>
      </defs>
    </svg>
  );
}
