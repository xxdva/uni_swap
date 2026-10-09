export function VerifiedBadge({ label }: { label: string }) {
  return (
    <span
      title={label}
      aria-label={label}
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white"
    >
      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  );
}
