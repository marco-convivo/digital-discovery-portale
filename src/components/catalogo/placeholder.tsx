// Placeholder pulito quando manca l'immagine di un servizio/lavoro.
export function ImgPlaceholder({ label }: { label?: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-card-2 text-text-3">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
        className="size-8 opacity-60" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L4 21" />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}
