"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/ui/status-pill";
import { PAYMENT_STATO_META } from "@/lib/stati";
import { euro, dataIt } from "@/lib/format";
import { segnaRataPagata, annullaRataPagata } from "@/lib/pagamenti/actions";
import type { Database } from "@/lib/database.types";

type PaymentStato = Database["public"]["Enums"]["payment_stato"];

export interface RataRow {
  id?: string;
  numero_rata: number | null;
  importo: number | null;
  scadenza: string | null;
  stato: PaymentStato;
}

function AzioniManuali({ r }: { r: RataRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (!r.id) return null;
  const run = (p: Promise<{ ok: boolean }>) =>
    start(async () => {
      await p;
      router.refresh();
    });
  if (r.stato === "paid") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => run(annullaRataPagata(r.id!))}
        className="text-[12px] font-semibold text-text-3 hover:text-text"
      >
        annulla
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => run(segnaRataPagata(r.id!))}
      className="rounded-pill bg-ink px-2.5 py-1 text-[12px] font-bold text-on-ink transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "…" : "Segna pagato"}
    </button>
  );
}

// Piano pagamenti: elenco rate con stato. Presentazionale nel portale;
// con `manuale` lo staff può segnare le rate pagate (riconciliazione SDD Sella).
export function PianoPagamenti({
  rate,
  manuale = false,
}: {
  rate: RataRow[];
  manuale?: boolean;
}) {
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
            <li key={r.id ?? i} className="flex items-center justify-between gap-3 py-2.5">
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
                {manuale && <AzioniManuali r={r} />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
