export function PlacementTrackerLogo({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect fill="url(#placement-bg)" height="52" rx="16" width="52" x="6" y="6" />
      <path d="M18 42H46" stroke="#DDF4FF" strokeLinecap="round" strokeWidth="4" />
      <circle cx="22" cy="30" fill="#F8FAFC" r="6" />
      <circle cx="34" cy="24" fill="#7DD3FC" r="6" />
      <circle cx="46" cy="18" fill="#FBBF24" r="6" />
      <path d="M22 30L34 24L46 18" stroke="#F8FAFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      <defs>
        <linearGradient gradientUnits="userSpaceOnUse" id="placement-bg" x1="12" x2="52" y1="10" y2="56">
          <stop stopColor="#0B6E99" />
          <stop offset="1" stopColor="#10243C" />
        </linearGradient>
      </defs>
    </svg>
  );
}
