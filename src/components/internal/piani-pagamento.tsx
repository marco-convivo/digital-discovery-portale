import { PianoPagamenti, type RataRow } from "@/components/internal/piano-pagamenti";
import { euro } from "@/lib/format";

export interface PianoGruppo {
  key: string;
  label: string;
  rate: RataRow[];
}

// Uno o più piani pagamento. Con più piani (multi-contratto) diventano sezioni
// collassabili (toggle), così non è pesante sfogliarle: la prima è aperta.
export function PianiPagamento({ groups }: { groups: PianoGruppo[] }) {
  if (groups.length === 0) return <PianoPagamenti rate={[]} />;
  if (groups.length === 1) return <PianoPagamenti rate={groups[0].rate} />;

  return (
    <div className="flex flex-col gap-2.5">
      {groups.map((g, i) => {
        const rata = g.rate[0]?.importo ?? null;
        const pagate = g.rate.filter((r) => r.stato === "paid").length;
        return (
          <details
            key={g.key}
            open={i === 0}
            className="group rounded-md border border-line"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3">
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-bold text-text">
                  {g.label}
                </div>
                <div className="text-[12px] text-text-3">
                  {euro(rata)}/mese · {pagate}/{g.rate.length} pagate
                </div>
              </div>
              <span className="flex-none text-text-3 transition-transform group-open:rotate-90">
                ›
              </span>
            </summary>
            <div className="border-t border-line px-3.5 pb-3 pt-1">
              <PianoPagamenti rate={g.rate} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
