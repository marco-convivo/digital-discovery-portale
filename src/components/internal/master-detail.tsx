"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { MasterClientiList } from "@/components/internal/master-clienti-list";
import { ActionLink, type ActionIcon } from "@/components/internal/action-link";
import { euro } from "@/lib/format";

export interface DettaglioDoc {
  id: string;
  titolo: string;
  stato: { tone: Tone; label: string };
  servizi: {
    label: string;
    importo?: number | null;
    scadenza?: string | null;
  }[];
  totale: number | null;
  rata?: number | null;
  durata?: string | null;
  action?: { href: string; label: string; external?: boolean; icon?: ActionIcon };
}

export interface ClienteConDoc {
  id: string;
  ragione_sociale: string;
  documenti: DettaglioDoc[];
}

export function MasterDetail({
  clienti,
  detailLabel,
  initialSelected,
}: {
  clienti: ClienteConDoc[];
  detailLabel: string;
  initialSelected?: string | null;
}) {
  const first =
    initialSelected && clienti.some((c) => c.id === initialSelected)
      ? initialSelected
      : (clienti[0]?.id ?? null);
  const [sel, setSel] = useState<string | null>(first);
  const current = clienti.find((c) => c.id === sel) ?? null;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <MasterClientiList
          items={clienti.map((c) => ({
            id: c.id,
            ragione_sociale: c.ragione_sociale,
            count: c.documenti.length,
          }))}
          selected={sel}
          onSelect={setSel}
        />
      </div>

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
                              <span className="min-w-0 truncate text-text">
                                {s.label}
                              </span>
                              <span className="flex flex-none items-baseline gap-3">
                                {s.scadenza && (
                                  <span className="text-[12px] text-text-3">
                                    {s.scadenza}
                                  </span>
                                )}
                                {s.importo != null && (
                                  <span className="text-text-2">
                                    {euro(s.importo)}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[12.5px] text-text-3">
                          Nessun servizio dettagliato.
                        </p>
                      )}

                      {d.action && (
                        <ActionLink
                          href={d.action.href}
                          label={d.action.label}
                          icon={d.action.icon}
                          external={d.action.external}
                          className="mt-3"
                        />
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
