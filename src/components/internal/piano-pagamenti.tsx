import { StatusPill } from "@/components/ui/status-pill";
import { PAYMENT_STATO_META } from "@/lib/stati";
import { euro, dataIt } from "@/lib/format";
import type { Database } from "@/lib/database.types";

type PaymentStato = Database["public"]["Enums"]["payment_stato"];

export interface RataRow {
  numero_rata: number | null;
  importo: number | null;
  scadenza: string | null;
  stato: PaymentStato;
}

// Piano pagamenti (dal mockup piano-pagamenti): elenco rate con stato.
// Presentazionale → riusabile anche nel portale cliente (Fase 3).
export function PianoPagamenti({ rate }: { rate: RataRow[] }) {
  if (rate.length === 0) {
    return (
      <p className="text-sm text-text-3">
        Nessun piano attivo. Si genera all&apos;attivazione del pagamento.
      </p>
    );
  }

  const totale = rate.reduce((s, r) => s + Number(r.importo ?? 0), 0);
  const pagate = rate.filter((r) => r.stato === "paid").length;
  const tot = rate.length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] text-text-2">
          {pagate} di {tot} rate pagate
        </span>
        <span className="tnum text-[15px] font-extrabold text-text">
          {euro(totale)}
          <span className="ml-1 text-[12px] font-medium text-text-3">totale</span>
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-line">
        {rate.map((r, i) => {
          const meta = PAYMENT_STATO_META[r.stato];
          return (
            <li key={i} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <div className="text-[14px] font-bold text-text">
                  Rata {r.numero_rata ?? i + 1}
                  <span className="font-medium text-text-3"> di {tot}</span>
                </div>
                <div className="text-[12.5px] text-text-3">
                  Scadenza {dataIt(r.scadenza)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="tnum text-[14px] font-bold text-text">
                  {euro(r.importo)}
                </span>
                <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
