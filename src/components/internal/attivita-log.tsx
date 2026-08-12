import { STATO_META } from "@/lib/stati";
import { dataBreve } from "@/lib/format";
import { TONE_DOT as DOT, type Tone } from "@/components/ui/status-pill";
import type { ClientStato } from "@/lib/types";
import type { AttivitaRow } from "@/lib/clienti/scheda";
import { cn } from "@/lib/utils";

/**
 * Cronologia della pratica come timeline VERTICALE (v0.5): ogni evento mostra il
 * suo stato (pallino + etichetta), il dettaglio e la data. Pensata per una
 * colonna stretta e scrollabile a destra della scheda. Più recente in alto.
 */
export function AttivitaLog({ attivita }: { attivita: AttivitaRow[] }) {
  if (attivita.length === 0) {
    return (
      <p className="text-[13px] text-text-3">Nessuna attività ancora registrata.</p>
    );
  }

  const eventi = [...attivita].reverse(); // dal più recente

  return (
    <ol className="flex flex-col">
      {eventi.map((a, i) => {
        const stato = a.a_stato as ClientStato | null;
        const meta = stato ? STATO_META[stato] : null;
        const label = meta?.label ?? a.azione ?? "Aggiornamento";
        const tone: Tone = meta?.tone ?? "draft";
        const dettaglio =
          a.azione && a.azione.trim() && a.azione.trim() !== label
            ? a.azione.trim()
            : null;
        const ultimo = i === eventi.length - 1;
        return (
          <li key={a.id} className="flex gap-3">
            {/* rail: pallino di stato + linea di collegamento */}
            <div className="flex flex-none flex-col items-center">
              <span className={cn("mt-1 size-2.5 rounded-full", DOT[tone])} />
              {!ultimo && <span className="w-px flex-1 bg-line" />}
            </div>
            <div className={cn("min-w-0", ultimo ? "pb-0.5" : "pb-4")}>
              <div className="text-[13px] font-bold text-text">{label}</div>
              {dettaglio && (
                <div className="mt-0.5 text-[12px] leading-snug text-text-2">
                  {dettaglio}
                </div>
              )}
              <div className="mt-0.5 text-[11.5px] text-text-3">
                {dataBreve(a.created_at)}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
