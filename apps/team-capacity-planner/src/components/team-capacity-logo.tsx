export function TeamCapacityLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="14" fill="#1f3a5f" />
      <circle cx="20" cy="24" r="6" fill="#b3defa" />
      <circle cx="32" cy="18" r="5" fill="#95d5f8" />
      <circle cx="44" cy="24" r="6" fill="#7bc5f4" />
      <rect x="14" y="34" width="36" height="16" rx="8" fill="#d7effd" />
      <path d="M18 42H46" stroke="#1f3a5f" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
