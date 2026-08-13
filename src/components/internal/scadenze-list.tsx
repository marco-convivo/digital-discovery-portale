"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { ignoraAvviso } from "@/lib/scadenze/actions";
import { dataIt } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ScadenzaItem {
  chiave: string;
  tipo: "servizio" | "contratto";
  clienteId: string;
  cliente: string;
  titolo: string;
  scadenzaIso: string;
  giorni: number;
}

function urgenza(g: number): { tone: Tone; label: string } {
  if (g < 0) return { tone: "fail", label: `scaduto da ${-g} gg` };
  if (g === 0) return { tone: "fail", label: "scade oggi" };
  if (g <= 30) return { tone: "wait", label: `tra ${g} gg` };
  return { tone: "info", label: `tra ${g} gg` };
}

export function ScadenzeList({
  items,
  isAdmin,
}: {
  items: ScadenzaItem[];
  isAdmin: boolean;
}) {
  const [aperto, setAperto] = useState<string | null>(null);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nessuna scadenza"
        hint="Le scadenze dei servizi ricorrenti e dei contratti compaiono qui, ordinate per urgenza."
      />
    );
  }

  const sel = items.find((i) => i.chiave === aperto) ?? null;

  function elimina(chiave: string) {
    setError(null);
    start(async () => {
      const res = await ignoraAvviso(chiave);
      if (res.ok) {
        setAperto(null);
        router.refresh();
      } else setError(res.error);
    });
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-line">
        {items.map((it) => {
          const u = urgenza(it.giorni);
          return (
            <li key={it.chiave}>
              <button
                type="button"
                onClick={() => setAperto(it.chiave)}
                className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-card-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-badge px-2 py-0.5 text-[11px] font-semibold",
                        it.tipo === "contratto"
                          ? "bg-violet-soft text-info-tx"
                          : "bg-bg-2 text-text-3",
                      )}
                    >
                      {it.tipo === "contratto" ? "Contratto" : "Servizio"}
                    </span>
                    <span className="truncate font-bold text-text">{it.cliente}</span>
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-text-3">
                    {it.titolo} · scade il {dataIt(it.scadenzaIso)}
                  </div>
                </div>
                <StatusPill tone={u.tone}>{u.label}</StatusPill>
              </button>
            </li>
          );
        })}
      </ul>

      {sel && (
        <Drawer
          open
          onClose={() => setAperto(null)}
          title={sel.cliente}
          subtitle={sel.tipo === "contratto" ? "Scadenza contratto" : "Scadenza servizio"}
        >
          <div className="flex flex-col gap-4">
            {error && (
              <p className="rounded-field bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2.5 rounded-md border border-line p-3.5">
              <Riga label={sel.tipo === "contratto" ? "Contratto" : "Servizio"} value={sel.titolo} />
              <Riga label="Scadenza" value={dataIt(sel.scadenzaIso)} />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-3">Stato</span>
                <StatusPill tone={urgenza(sel.giorni).tone}>
                  {urgenza(sel.giorni).label}
                </StatusPill>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/vendite/clienti/${sel.clienteId}`}
                className="rounded-btn bg-ink px-4 py-2.5 text-center text-[13.5px] font-semibold text-on-ink transition-opacity hover:opacity-90"
              >
                Apri la scheda cliente
              </Link>
              {isAdmin && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => elimina(sel.chiave)}
                  className="rounded-btn border border-line-strong px-4 py-2.5 text-[13.5px] font-semibold text-fail-tx transition-colors hover:bg-fail-bg disabled:opacity-50"
                >
                  {pending ? "…" : "Elimina avviso (non rinnovo)"}
                </button>
              )}
            </div>
            {isAdmin && (
              <p className="text-[12px] text-text-3">
                Eliminando l&apos;avviso, questa scadenza non comparirà più in
                elenco. Puoi ripristinarla solo dal database.
              </p>
            )}
          </div>
        </Drawer>
      )}
    </>
  );
}

function Riga({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[13px] text-text-3">{label}</span>
      <span className="text-right text-[13.5px] font-semibold text-text">{value}</span>
    </div>
  );
}
