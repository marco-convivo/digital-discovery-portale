"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { euro } from "@/lib/format";

export interface DettaglioDoc {
  id: string;
  titolo: string; // "PREV-2026-002 · 10 lug 2026" oppure "Firmato il 01/06/2026"
  stato: { tone: Tone; label: string };
  servizi: { label: string; importo?: number | null }[];
  totale: number | null;
  rata?: number | null;
  durata?: string | null;
  action?: { href: string; label: string; external?: boolean };
}

export interface ClienteConDoc {
  id: string;
  ragione_sociale: string;
  documenti: DettaglioDoc[];
}

export function MasterDetail({
  clienti,
  detailLabel,
}: {
  clienti: ClienteConDoc[];
  detailLabel: string; // "preventivi" | "contratti"
}) {
  const [sel, setSel] = useState<string | null>(clienti[0]?.id ?? null);
  const [q, setQ] = useState("");

  const query = q.toLowerCase().trim();
  const filtrati = useMemo(
    () =>
      query
        ? clienti.filter((c) => c.ragione_sociale.toLowerCase().includes(query))
        : clienti,
    [query, clienti],
  );
  const current = clienti.find((c) => c.id === sel) ?? null;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-3">
      {/* Master: lista clienti */}
      <Card className="p-3 lg:col-span-1 lg:sticky lg:top-6">
        <div className="relative mb-2">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 size-[17px] -translate-y-1/2 text-text-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca cliente…"
            className="w-full rounded-md border border-line bg-card py-2 pl-9 pr-3 text-[13.5px] text-text placeholder:text-text-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet"
          />
        </div>
        {filtrati.length === 0 ? (
          <p className="px-2 py-6 text-center text-[13px] text-text-3">
            Nessun cliente.
          </p>
        ) : (
          <ul className="flex max-h-[65vh] flex-col gap-0.5 overflow-y-auto">
            {filtrati.map((c) => {
              const active = c.id === sel;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setSel(c.id)}
                    className={
                      "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[13.5px] transition-colors " +
                      (active
                        ? "bg-ink text-on-ink"
                        : "text-text-2 hover:bg-card-2 hover:text-text")
                    }
                  >
                    <span className="truncate font-semibold">
                      {c.ragione_sociale}
                    </span>
                    <span
                      className={
                        "flex-none rounded-pill px-1.5 text-[11px] font-bold " +
                        (active ? "bg-on-ink/20" : "bg-card-2 text-text-3")
                      }
                    >
                      {c.documenti.length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Detail: documenti del cliente selezionato */}
      <div className="lg:col-span-2">
        {!current ? (
          <Card>
            <EmptyState
              title="Seleziona un cliente"
              hint={`Scegli un cliente a sinistra per vedere i suoi ${detailLabel}.`}
            />
          </Card>
        ) : (
          <Card>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-extrabold tracking-[-0.01em] text-text">
                {current.ragione_sociale}
              </h2>
              <span className="text-[12.5px] text-text-3">
                {current.documenti.length} {detailLabel}
              </span>
            </div>

            {current.documenti.length === 0 ? (
              <p className="text-sm text-text-3">Nessun documento.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {current.documenti.map((d, i) => (
                  <details
                    key={d.id}
                    open={i === 0}
                    className="group rounded-md border border-line"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-bold text-text">
                          {d.titolo}
                        </div>
                        <div className="text-[12px] text-text-3">
                          Totale {euro(d.totale)}
                          {d.rata != null && ` · ${euro(d.rata)}/mese`}
                          {d.durata && ` · ${d.durata}`}
                        </div>
                      </div>
                      <div className="flex flex-none items-center gap-2.5">
                        <StatusPill tone={d.stato.tone}>{d.stato.label}</StatusPill>
                        <span className="text-text-3 transition-transform group-open:rotate-90">
                          ›
                        </span>
                      </div>
                    </summary>

                    <div className="border-t border-line px-3.5 pb-3.5 pt-3">
                      {d.servizi.length > 0 ? (
                        <ul className="flex flex-col gap-1.5">
                          {d.servizi.map((s, j) => (
                            <li
                              key={j}
                              className="flex items-baseline justify-between gap-3 text-[13px]"
                            >
                              <span className="text-text">{s.label}</span>
                              {s.importo != null && (
                                <span className="flex-none text-text-2">
                                  {euro(s.importo)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[12.5px] text-text-3">
                          Nessun servizio dettagliato.
                        </p>
                      )}

                      {d.action && (
                        <a
                          href={d.action.href}
                          target={d.action.external ? "_blank" : undefined}
                          rel={d.action.external ? "noopener noreferrer" : undefined}
                          className="mt-3 inline-block text-[13px] font-semibold text-violet hover:underline"
                        >
                          {d.action.label} →
                        </a>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
