import { cn } from "@/lib/utils";

/**
 * Elemento firma del design system: pallino + etichetta + pill tenue.
 * Identico su rate, contratti e pipeline = "trasparenza resa interfaccia".
 * Presentazionale: la mappatura stato-dominio → tone/label sta in @/lib/stati.
 *
 * v0.4 — i 5 tone sono i casi reali: positivo (paid/verde) · ricorrente
 * (info/violetto) · attenzione (wait/ambra) · errore (fail/rosso) · neutro
 * (draft). REGOLA: max DUE pill colorate per schermata (menta e violetto
 * significano azione/impegno, non decorazione); tutto il resto è testo normale.
 */
export type Tone = "paid" | "info" | "wait" | "fail" | "draft";

const TONES: Record<Tone, { pill: string; dot: string }> = {
  paid: { pill: "bg-paid-bg text-paid-tx", dot: "bg-paid-dot" },
  info: { pill: "bg-info-bg text-info-tx", dot: "bg-info-dot" },
  wait: { pill: "bg-wait-bg text-wait-tx", dot: "bg-wait-dot" },
  fail: { pill: "bg-fail-bg text-fail-tx", dot: "bg-fail-dot" },
  draft: { pill: "bg-draft-bg text-draft-tx", dot: "bg-draft-dot" },
};

export interface StatusPillProps {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}

export function StatusPill({ tone, children, className }: StatusPillProps) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 text-xs font-semibold leading-none",
        t.pill,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", t.dot)} />
      {children}
    </span>
  );
}
