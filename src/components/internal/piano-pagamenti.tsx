"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
      className="whitespace-nowrap rounded-pill bg-ink px-2.5 py-1 text-[12px] font-bold text-on-ink transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "…" : "Segna pagato"}
    </button>
  );
}

function RigaRata({
  r,
  i,
  tot,
  manuale,
}: {
  r: RataRow;
  i: number;
  tot: number;
  manuale: boolean;
}) {
  const meta = PAYMENT_STATO_META[r.stato];
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="min-w-0">
        <div className="text-[14px] font-bold text-text">
          Rata {r.numero_rata ?? i + 1}
          <span className="font-medium text-text-3"> di {tot}</span>
        </div>
        <div className="text-[12.5px] text-text-3">
          Scadenza {dataIt(r.scadenza)}
        </div>
      </div>
      <div className="flex flex-none items-center gap-2.5">
        <span className="tnum whitespace-nowrap text-[14px] font-bold text-text">
          {euro(r.importo)}
        </span>
        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
        {manuale && <AzioniManuali r={r} />}
      </div>
    </div>
  );
}

/**
 * Piano pagamenti compatto: riepilogo + eventuale alert per le rate non andate
 * a buon fine + la PROSSIMA rata in evidenza. L'elenco completo è nascosto
 * dietro "Vedi tutte le rate". Con `manuale` lo staff può segnare pagate.
 */
export function PianoPagamenti({
  rate,
  manuale = false,
}: {
  rate: RataRow[];
  manuale?: boolean;
}) {
  const [aperto, setAperto] = useState(false);

  if (rate.length === 0) {
    return (
      <p className="text-sm text-text-3">
        Nessun piano attivo. Si genera all&apos;attivazione del pagamento.
      </p>
    );
  }

  const tot = rate.length;
  const totale = rate.reduce((s, r) => s + Number(r.importo ?? 0), 0);
  const pagate = rate.filter((r) => r.stato === "paid").length;
  const fallite = rate.filter((r) => r.stato === "failed");
  const prossima = rate.find(
    (r) => r.stato === "scheduled" || r.stato === "pending",
  );

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

      {fallite.length > 0 && (
        <div className="mb-2.5 flex items-center gap-2.5 rounded-md bg-fail-bg px-3.5 py-3">
          <AlertIcon className="size-5 flex-none text-fail-tx" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-fail-tx">
              {fallite.length}{" "}
              {fallite.length === 1 ? "rata non riuscita" : "rate non riuscite"}
            </div>
            <div className="truncate text-[12px] text-fail-tx/80">
              Rata {fallite.map((r) => r.numero_rata ?? "—").join(", ")} · da
              recuperare
            </div>
          </div>
          <Link
            href="/vendite/insoluti"
            className="flex-none rounded-pill bg-card px-3 py-1.5 text-[12px] font-bold text-fail-tx"
          >
            Gestisci
          </Link>
        </div>
      )}

      {prossima ? (
        <div className="rounded-md bg-card-2 p-3.5">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-text-3">
            Prossima rata
          </div>
          <RigaRata r={prossima} i={0} tot={tot} manuale={manuale} />
        </div>
      ) : (
        fallite.length === 0 && (
          <div className="flex items-center gap-2 rounded-md bg-paid-bg px-3.5 py-3 text-[13px] font-bold text-paid-tx">
            <CheckIcon className="size-[18px]" />
            Tutte le rate sono state pagate.
          </div>
        )
      )}

      {tot > 1 && (
        <>
          <button
            type="button"
            onClick={() => setAperto((v) => !v)}
            className="mt-3 text-[12.5px] font-bold text-violet hover:underline"
          >
            {aperto ? "Nascondi" : `Vedi tutte le ${tot} rate`}
          </button>

          {aperto && (
            <div className="mt-2 flex flex-col divide-y divide-line border-t border-line">
              {rate.map((r, i) => (
                <div key={r.id ?? i} className="py-2.5">
                  <RigaRata r={r} i={i} tot={tot} manuale={manuale} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}
