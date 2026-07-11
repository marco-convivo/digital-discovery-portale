export type ActionIcon = "link" | "pdf";

// Link d'azione con icona: chiarisce cosa apre (PDF firmato vs link cliente).
export function ActionLink({
  href,
  label,
  icon,
  external = true,
  className = "",
}: {
  href: string;
  label: string;
  icon?: ActionIcon;
  external?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={
        "inline-flex items-center gap-1.5 text-[13px] font-semibold text-violet hover:underline " +
        className
      }
    >
      {icon === "pdf" && <PdfIcon />}
      {icon === "link" && <LinkIcon />}
      {label}
    </a>
  );
}

function PdfIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 15h6M9 18h4" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}
