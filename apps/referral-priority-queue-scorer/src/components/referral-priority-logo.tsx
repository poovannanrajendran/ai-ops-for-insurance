export function ReferralPriorityQueueLogo({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 96 96">
      <rect x="10" y="10" width="76" height="76" rx="24" fill="url(#queue-bg)" />
      <path d="M28 31H64" stroke="white" strokeWidth="5" strokeLinecap="round" />
      <path d="M28 48H58" stroke="#CFFAFE" strokeWidth="5" strokeLinecap="round" />
      <path d="M28 65H51" stroke="#99F6E4" strokeWidth="5" strokeLinecap="round" />
      <circle cx="69" cy="31" r="7" fill="#F59E0B" />
      <circle cx="63" cy="48" r="7" fill="#14B8A6" />
      <circle cx="56" cy="65" r="7" fill="#0F766E" />
      <defs>
        <linearGradient id="queue-bg" x1="16" y1="14" x2="80" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F172A" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
      </defs>
    </svg>
  );
}
