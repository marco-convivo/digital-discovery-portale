import { cn } from "@/lib/utils";

// Percorso cliente in 4 tappe, mostrato in cima a preventivo, firma e pagamento.
// Rende esplicito che si tratta di un processo a più passi.
const STEPS = ["Preventivo", "Dati", "Firma", "Pagamento"] as const;

export type FlowStep = 1 | 2 | 3 | 4;

export function FlowStepper({ current }: { current: FlowStep }) {
  return (
    <nav aria-label="Avanzamento" className="mb-8">
      <ol className="flex items-start">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li
              key={label}
              className="relative flex flex-1 flex-col items-center"
            >
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute right-1/2 top-[15px] h-0.5 w-full",
                    n <= current ? "bg-mint" : "bg-line",
                  )}
                />
              )}
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "relative z-10 grid size-8 place-items-center rounded-full text-[13px] font-bold transition-colors",
                  done && "bg-mint text-on-mint",
                  active && "bg-ink text-on-ink",
                  !done && !active && "bg-card-2 text-text-3 ring-1 ring-line",
                )}
              >
                {done ? <CheckIcon /> : n}
              </span>
              <span
                className={cn(
                  "mt-1.5 text-center text-[10.5px] leading-tight sm:text-[12px]",
                  active ? "font-bold text-text" : "font-medium text-text-3",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
