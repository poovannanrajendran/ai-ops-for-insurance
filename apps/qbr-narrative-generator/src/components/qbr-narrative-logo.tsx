export function QbrNarrativeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="14" fill="#0f3f5a" />
      <rect x="12" y="37" width="7" height="15" rx="3" fill="#8fded8" />
      <rect x="24" y="30" width="7" height="22" rx="3" fill="#afeae4" />
      <rect x="36" y="22" width="7" height="30" rx="3" fill="#d2f5f1" />
      <path d="M13 18L28 11L42 16" stroke="#dffcf8" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
