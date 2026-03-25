interface LogoProps {
  className?: string;
}

export function MrcCheckerLogo({ className }: LogoProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="36" height="48" rx="8" fill="#17313B" />
      <path d="M20 21H35M20 30H35M20 39H31" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
      <circle cx="46" cy="42" r="10" fill="#D7F4EB" />
      <path d="M42 42L45 45L51 38" stroke="#0B5D57" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
