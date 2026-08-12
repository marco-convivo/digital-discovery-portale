"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { StatusPill } from "@/components/ui/status-pill";
import { PAYMENT_STATO_META } from "@/lib/stati";
import { euro, dataIt } from "@/lib/format";
import {
  segnaRataPagata,
  segnaRataNonRiuscita,
  annullaRataPagata,
} from "@/lib/pagamenti/actions";
import { cn } from "@/lib/utils";
import type { PianoGruppo } from "@/components/internal/piani-pagamento";
import type { RataRow } from "@/components/internal/piano-pagamenti";

function sintesi(rate: RataRow[]) {
  const pagate = rate.filter((r) => r.stato === "paid").length;
  const fallite = rate.filter((r) => r.stato === "failed").length;
  const prossima =
    rate
      .filter((r) => r.stato === "scheduled" || r.stato === "pending")
      .sort((a, b) => (a.scadenza ?? "").localeCompare(b.scadenza ?? ""))[0] ?? null;
  const attivo = pagate < rate.length; // ha ancora rate da incassare
  return { pagate, fallite, prossima, attivo, totale: rate.length };
}

export function PianiCliente({ piani }: { piani: PianoGruppo[] }) {
  const [aperto, setAperto] = useState<number | null>(null);

  if (piani.length === 0) {
    return (
      <p className="text-sm text-text-3">
        Nessun piano attivo. Si genera all&apos;attivazione del pagamento.
      </p>
    );
  }

  // Attivi in alto (evidenziati), completati (tutti pagati) neutri sotto.
  const ordinati = piani
    .map((p, i) => ({ p, i, s: sintesi(p.rate) }))
    .sort((a, b) => Number(b.s.attivo) - Number(a.s.attivo));

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {ordinati.map(({ p, i, s }) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setAperto(i)}
            className={cn(
              "w-full rounded-md border p-3.5 text-left transition-colors",
              s.attivo
                ? "border-line-strong bg-card hover:border-ink"
                : "border-line bg-card-2/60 hover:border-line-strong",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "truncate text-[13.5px] font-bold",
                  s.attivo ? "text-text" : "text-text-2",
                )}
              >
                {p.label}
              </span>
              {s.fallite > 0 ? (
                <StatusPill tone="fail">{s.fallite} non riuscite</StatusPill>
              ) : s.attivo ? (
                <span className="tnum flex-none text-[12.5px] font-semibold text-text-3">
                  {s.pagate}/{s.totale}
                </span>
              ) : (
                <StatusPill tone="paid">Saldato</StatusPill>
              )}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-line-soft">
              <div
                className="h-full rounded-pill bg-paid-dot"
                style={{ width: `${Math.round((s.pagate / s.totale) * 100)}%` }}
              />
            </div>
            {s.attivo && s.prossima && (
              <div className="mt-2 text-[12.5px] text-text-2">
                Prossima rata{" "}
                <span className="tnum font-semibold text-text">
                  {euro(s.prossima.importo)}
                </span>{" "}
                · {dataIt(s.prossima.scadenza)}
              </div>
            )}
          </button>
        ))}
      </div>

      {aperto !== null && piani[aperto] && (
        <PianoDrawer piano={piani[aperto]} onClose={() => setAperto(null)} />
      )}
    </>
  );
}

function PianoDrawer({ piano, onClose }: { piano: PianoGruppo; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const s = sintesi(piano.rate);

  const daGestire = piano.rate
    .filter((r) => r.stato !== "paid")
    .sort((a, b) => (a.numero_rata ?? 0) - (b.numero_rata ?? 0));
  const pagate = piano.rate
    .filter((r) => r.stato === "paid")
    .sort((a, b) => (a.numero_rata ?? 0) - (b.numero_rata ?? 0));

  const run = (p: Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    start(async () => {
      const res = await p;
      if (!res.ok) setError(res.error ?? "Errore.");
      else router.refresh();
    });
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={piano.label}
      subtitle={`${s.pagate} di ${s.totale} rate saldate${piano.manuale ? " · addebito manuale" : " · su carta"}`}
    >
      <div className="flex flex-col gap-4">
        {error && (
          <p className="rounded-field bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
            {error}
          </p>
        )}

        {daGestire.length > 0 && (
          <div className="flex flex-col gap-2">
            {daGestire.map((r, i) => {
              const meta = PAYMENT_STATO_META[r.stato];
              return (
                <div
                  key={r.id ?? i}
                  className={cn(
                    "rounded-md border p-3",
                    r.stato === "failed"
                      ? "border-fail-dot bg-fail-bg/50"
                      : "border-line",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[13.5px] font-bold text-text">
                        Rata {r.numero_rata ?? i + 1}
                      </div>
                      <div className="text-[12px] text-text-3">
                        Scadenza {dataIt(r.scadenza)}
                      </div>
                    </div>
                    <span className="tnum text-[14px] font-bold text-text">
                      {euro(r.importo)}
                    </span>
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  </div>
                  {piano.manuale && r.id && (
                    <div className="mt-2.5 flex flex-wrap gap-2 border-t border-line pt-2.5">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(segnaRataPagata(r.id!))}
                        className="rounded-pill bg-ink px-3 py-1.5 text-[12px] font-bold text-on-ink disabled:opacity-50"
                      >
                        Segna pagata
                      </button>
                      {r.stato !== "failed" && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(segnaRataNonRiuscita(r.id!))}
                          className="rounded-pill border border-line-strong px-3 py-1.5 text-[12px] font-bold text-fail-tx disabled:opacity-50"
                        >
                          Non riuscita
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pagate.length > 0 && (
          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-text-3">
              Pagate ({pagate.length})
            </div>
            <div className="flex flex-col divide-y divide-line-soft rounded-md border border-line">
              {pagate.map((r, i) => (
                <div
                  key={r.id ?? i}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]"
                >
                  <span className="text-text-3">
                    Rata {r.numero_rata ?? i + 1} · {dataIt(r.scadenza)}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tnum font-semibold text-text-2">
                      {euro(r.importo)}
                    </span>
                    {piano.manuale && r.id && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(annullaRataPagata(r.id!))}
                        className="text-[12px] font-semibold text-text-3 hover:text-fail-tx disabled:opacity-50"
                      >
                        annulla
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
