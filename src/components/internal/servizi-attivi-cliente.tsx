"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { ServizioAttivo } from "@/lib/clienti/scheda";

/**
 * Servizi attivi del cliente: elenco a colpo d'occhio (pallino attivo/in
 * scadenza + scadenza). Cliccando un servizio si apre un drawer con "cosa
 * comprende" — le attività dal catalogo, o il testo della voce custom.
 */
export function ServiziAttiviCliente({ servizi }: { servizi: ServizioAttivo[] }) {
  const [aperto, setAperto] = useState<number | null>(null);

  if (servizi.length === 0) {
    return (
      <p className="text-sm text-text-3">
        Nessun servizio attivo: compaiono qui alla firma del contratto.
      </p>
    );
  }

  const s = aperto !== null ? servizi[aperto] : null;

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        {servizi.map((sv, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAperto(i)}
            className="flex items-center gap-2.5 rounded-md border border-line px-3 py-2 text-left transition-colors hover:border-line-strong"
          >
            <span
              className={cn(
                "size-1.5 flex-none rounded-full",
                sv.inScadenza ? "bg-wait-dot" : "bg-paid-dot",
              )}
            />
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
              {sv.label}
            </span>
            <span
              className={cn(
                "flex-none text-[12px]",
                sv.inScadenza ? "font-semibold text-wait-tx" : "text-text-3",
              )}
            >
              {sv.meta}
            </span>
          </button>
        ))}
      </div>

      {s && (
        <Drawer
          open
          onClose={() => setAperto(null)}
          title={s.label}
          subtitle={
            <>
              {s.custom ? "Voce personalizzata" : "Servizio a catalogo"} · {s.meta}
            </>
          }
        >
          <div className="flex flex-col gap-4">
            {s.descrizione && (
              <p className="text-[14px] leading-relaxed text-text-2">
                {s.descrizione}
              </p>
            )}
            {s.incluse.length > 0 && (
              <div>
                <div className="mb-2 text-[12.5px] font-semibold text-text-2">
                  Cosa comprende
                </div>
                <ul className="flex flex-col gap-1.5">
                  {s.incluse.map((v, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13.5px] text-text"
                    >
                      <span className="mt-[7px] size-1.5 flex-none rounded-full bg-mint" />
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!s.descrizione && s.incluse.length === 0 && (
              <p className="text-[13.5px] text-text-3">
                {s.custom
                  ? "Nessun dettaglio inserito per questa voce."
                  : "Nessun contenuto a catalogo per questo servizio."}
              </p>
            )}
          </div>
        </Drawer>
      )}
    </>
  );
}
