import { cn } from "@/lib/utils";

/**
 * Checklist "Prima di inviare" (7b): calcolata in tempo reale. Un `blocco`
 * (rosso) impedisce l'invio pulito; un `avviso` (ambra) non blocca; `ok` (verde)
 * è a posto. Presentazionale: la logica dei blocchi vive nella schermata.
 */
export type PreflightStato = "ok" | "avviso" | "blocco";

export interface PreflightItem {
  label: React.ReactNode;
  stato: PreflightStato;
}

export function PreflightList({ items }: { items: PreflightItem[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[13px]">
          <PreflightIcon stato={it.stato} />
          <span
            className={cn(
              "leading-relaxed",
              it.stato === "blocco"
                ? "font-semibold text-fail-tx"
                : it.stato === "avviso"
                  ? "text-wait-tx"
                  : "text-text-2",
            )}
          >
            {it.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PreflightIcon({ stato }: { stato: PreflightStato }) {
  const cls =
    "mt-[1px] grid size-4 flex-none place-items-center rounded-full";
  if (stato === "ok")
    return (
      <span className={cn(cls, "bg-paid-bg text-paid-tx")}>
        <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5L20 7" />
        </svg>
      </span>
    );
  if (stato === "avviso")
    return (
      <span className={cn(cls, "bg-wait-bg text-wait-tx font-bold")}>
        <span className="text-[10px] leading-none">!</span>
      </span>
    );
  return (
    <span className={cn(cls, "bg-fail-bg text-fail-tx")}>
      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </span>
  );
}
