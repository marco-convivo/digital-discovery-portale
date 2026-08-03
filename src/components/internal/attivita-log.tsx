import { STATO_META } from "@/lib/stati";
import type { Tone } from "@/components/ui/status-pill";
import type { ClientStato } from "@/lib/types";
import type { AttivitaRow } from "@/lib/clienti/scheda";
import { cn } from "@/lib/utils";

const DOT: Record<Tone, string> = {
  paid: "bg-paid-dot",
  info: "bg-info-dot",
  wait: "bg-wait-dot",
  fail: "bg-fail-dot",
  draft: "bg-draft-dot",
};

function dataBreve(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/**
 * Barra log attività (4b): la storia della pratica come timeline orizzontale.
 * Ogni nodo è una transizione di stato (o un'azione) scritta dal trigger su
 * activity_log. Scorre in orizzontale su schermi stretti.
 */
export function AttivitaLog({ attivita }: { attivita: AttivitaRow[] }) {
  if (attivita.length === 0) {
    return (
      <p className="text-[13px] text-text-3">
        Nessuna attività ancora registrata.
      </p>
    );
  }

  return (
    <ol className="no-scrollbar flex items-start gap-0 overflow-x-auto pb-1">
      {attivita.map((a, i) => {
        const stato = a.a_stato as ClientStato | null;
        const meta = stato ? STATO_META[stato] : null;
        const label = meta?.label ?? a.azione;
        const tone: Tone = meta?.tone ?? "draft";
        return (
          <li key={a.id} className="flex items-start">
            {i > 0 && (
              <span className="mt-[6px] h-px w-8 flex-none bg-line-strong" aria-hidden />
            )}
            <div className="flex w-max flex-none flex-col items-center gap-1 px-1.5">
              <span className={cn("size-3 rounded-full", DOT[tone])} />
              <span className="whitespace-nowrap text-[12px] font-semibold text-text">
                {label}
              </span>
              <span className="whitespace-nowrap text-[11px] text-text-3">
                {dataBreve(a.created_at)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
