"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ActionLink } from "@/components/internal/action-link";
import { PianiCliente } from "@/components/internal/piani-cliente";
import { PreventiviList } from "@/components/internal/preventivi-list";
import { FattureCliente, type FatturaRow } from "@/components/internal/fatture-cliente";
import { AllegatiCliente, type AllegatoRow } from "@/components/internal/allegati-cliente";
import { contractMeta } from "@/lib/stati";
import { scadenzeServizi, labelScadenza } from "@/lib/servizi";
import { dataIt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PianoGruppo } from "@/components/internal/piani-pagamento";
import type { PreventivoItem } from "@/components/internal/preventivi-list";
import type { ContractRow } from "@/lib/clienti/scheda";

type Tab = "piano" | "contratti" | "preventivi" | "fatture" | "allegati";

/**
 * Dettagli della scheda cliente come sezione a TAB (una vista alla volta):
 * meno card impilate, il contenuto scelto si apre qui. Il dettaglio del piano
 * si espande inline (niente modale a destra).
 */
export function SchedaDettagli({
  clientId,
  piani,
  contratti,
  quotes,
  fatture,
  allegati,
  isAdmin,
}: {
  clientId: string;
  piani: PianoGruppo[];
  contratti: ContractRow[];
  quotes: PreventivoItem[];
  fatture: FatturaRow[];
  allegati: AllegatoRow[];
  isAdmin: boolean;
}) {
  const [tab, setTab] = useState<Tab>("piano");

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "piano", label: "Piano pagamenti", count: piani.length },
    { key: "contratti", label: "Contratti", count: contratti.length },
    { key: "preventivi", label: "Preventivi", count: quotes.length },
    { key: "fatture", label: "Fatture", count: fatture.length },
    { key: "allegati", label: "Allegati", count: allegati.length },
  ];

  return (
    <Card className="p-0">
      <nav className="no-scrollbar flex flex-wrap gap-2 border-b border-line p-3">
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex flex-none items-center gap-1.5 rounded-btn px-3.5 py-2 text-[13.5px] font-semibold transition-colors",
                on
                  ? "bg-ink text-on-ink"
                  : "bg-card-2 text-text-2 hover:bg-line-soft hover:text-text",
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={cn(
                    "tnum grid min-w-[18px] place-items-center rounded-pill px-1 text-[11px] font-bold",
                    on ? "bg-white/20 text-on-ink" : "bg-bg-2 text-text-3",
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-[18px]">
        {tab === "piano" && <PianiCliente piani={piani} />}
        {tab === "contratti" && <Contratti contratti={contratti} />}
        {tab === "preventivi" && <PreventiviList quotes={quotes} isAdmin={isAdmin} />}
        {tab === "fatture" && <FattureCliente clientId={clientId} fatture={fatture} />}
        {tab === "allegati" && (
          <>
            <p className="mb-3 text-[12px] font-medium text-text-3">
              Documenti interni · non visibili al cliente
            </p>
            <AllegatiCliente clientId={clientId} allegati={allegati} />
          </>
        )}
      </div>
    </Card>
  );
}

function Contratti({ contratti }: { contratti: ContractRow[] }) {
  if (contratti.length === 0)
    return <p className="text-sm text-text-3">Nessun contratto ancora.</p>;

  return (
    <div className="flex flex-col gap-3">
      {contratti.map((ct) => {
        const servizi = scadenzeServizi(ct.quote?.ordine ?? null, ct.signed_at);
        return (
          <div key={ct.id} className="rounded-md border border-line p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[13px] font-semibold text-text">
                {ct.signed_at
                  ? `Firmato il ${dataIt(ct.signed_at)}`
                  : `Creato ${dataIt(ct.created_at)}`}
              </div>
              <div className="flex items-center gap-3">
                <StatusPill tone={contractMeta(ct.stato).tone}>
                  {contractMeta(ct.stato).label}
                </StatusPill>
                {ct.signed_pdf_url && (
                  <ActionLink href={ct.signed_pdf_url} label="PDF firmato" icon="pdf" />
                )}
              </div>
            </div>
            {servizi.length > 0 && (
              <ul className="mt-2.5 flex flex-col gap-1 border-t border-line pt-2.5">
                {servizi.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-baseline justify-between gap-2 text-[12.5px]"
                  >
                    <span className="min-w-0 truncate text-text-2">{s.label}</span>
                    <span className="flex-none text-text-3">{labelScadenza(s)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
