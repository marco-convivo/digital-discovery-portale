import Link from "next/link";
import { StatusPill, TONE_DOT } from "@/components/ui/status-pill";
import { euro } from "@/lib/format";
import { cn } from "@/lib/utils";
import { raggruppaCoda, type CodaItem } from "@/lib/oggi/queries";

const GRUPPO_TX: Record<string, string> = {
  soldi_fermi: "text-fail-tx",
  ferme: "text-wait-tx",
  movimento: "text-text-2",
};

/**
 * Coda di lavoro densa (1b): tabella raggruppata per urgenza (Soldi fermi ·
 * Ferme da 14+ giorni · In movimento). Una riga per pratica, azione a destra.
 */
export function CodaLavoro({ items }: { items: CodaItem[] }) {
  const sezioni = raggruppaCoda(items);

  if (sezioni.length === 0) {
    return (
      <div className="rounded-crm border border-line bg-card p-8 text-center">
        <p className="text-[15px] font-bold text-text">Niente in coda ✨</p>
        <p className="mt-1 text-[13px] text-text-2">
          Nessuna pratica ferma, nessun insoluto. Tutto in movimento.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-crm border border-line bg-card">
      <div className="grid grid-cols-[2.4fr_3fr_1.3fr_1.4fr_1.1fr] border-b border-line bg-card-2 px-4 py-2 text-[12px] font-semibold text-text-2">
        <span>Cliente</span>
        <span>Situazione</span>
        <span>Valore</span>
        <span>Fase</span>
        <span className="text-right">Azione</span>
      </div>

      {sezioni.map((s) => (
        <div key={s.gruppo}>
          <div
            className={cn(
              "flex items-center gap-2 border-b border-line bg-card-2 px-4 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide",
              GRUPPO_TX[s.gruppo],
            )}
          >
            <span className={cn("size-1.5 rounded-full", TONE_DOT[s.tone])} />
            {s.label} · {s.items.length}
          </div>
          {s.items.map((it) => (
            <div
              key={it.key}
              className="grid grid-cols-[2.4fr_3fr_1.3fr_1.4fr_1.1fr] items-center border-b border-line-soft px-4 py-2.5 text-[13px] last:border-b-0"
            >
              <span className="truncate font-bold text-text">{it.ragioneSociale}</span>
              <span className="truncate text-text-2">{it.situazione}</span>
              <span className="tnum font-bold text-text">
                {it.importo != null ? euro(it.importo) : "—"}
              </span>
              <span>
                <StatusPill tone={it.tone}>{it.statoLabel}</StatusPill>
              </span>
              <span className="text-right">
                <Link
                  href={it.azione.href}
                  className={cn(
                    "inline-flex whitespace-nowrap rounded-pill px-3 py-1 text-[12px] font-bold",
                    it.gruppo === "soldi_fermi"
                      ? "bg-ink text-on-ink"
                      : "border border-line-strong text-text",
                  )}
                >
                  {it.azione.label}
                </Link>
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
