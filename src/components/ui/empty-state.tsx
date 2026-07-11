import type { ReactNode } from "react";

// Stato vuoto sobrio ma con carattere: icona in cerchio tenue + messaggio.
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-md border border-dashed border-line px-5 py-12 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-card-2 text-text-3">
        {icon ?? <DefaultIcon />}
      </div>
      <p className="text-[14px] font-semibold text-text-2">{title}</p>
      {hint && <p className="max-w-xs text-[12.5px] leading-relaxed text-text-3">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

function DefaultIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    </svg>
  );
}
