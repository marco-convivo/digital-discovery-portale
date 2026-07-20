"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MasterClientiList } from "@/components/internal/master-clienti-list";
import {
  PianiPagamento,
  type PianoGruppo,
} from "@/components/internal/piani-pagamento";
import {
  FattureCliente,
  type FatturaRow,
} from "@/components/internal/fatture-cliente";

export interface ClientePagamenti {
  id: string;
  ragione_sociale: string;
  piani: PianoGruppo[]; // un gruppo per contratto
  fatture: FatturaRow[];
}

export function MasterDetailPagamenti({
  clienti,
  initialSelected,
}: {
  clienti: ClientePagamenti[];
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
            count: c.piani.length,
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
              hint="Scegli un cliente a sinistra per vedere i suoi pagamenti, raggruppati per contratto."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-5">
            <Card>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-extrabold tracking-[-0.01em] text-text">
                  {current.ragione_sociale}
                </h2>
                <span className="text-[12.5px] text-text-3">
                  {current.piani.length}{" "}
                  {current.piani.length === 1 ? "contratto" : "contratti"}
                </span>
              </div>
              <PianiPagamento groups={current.piani} />
            </Card>

            <Card>
              <div className="mb-4">
                <h3 className="text-lg font-extrabold tracking-[-0.01em] text-text">
                  Fatture
                </h3>
              </div>
              <FattureCliente
                key={current.id}
                clientId={current.id}
                fatture={current.fatture}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
