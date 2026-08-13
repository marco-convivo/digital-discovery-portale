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
  riferimento: string | null;
  scadenzaIso: string;
  giorni: number;
}

function urgenza(g: number): { tone: Tone; label: string } {
  if (g < 0) return { tone: "fail", label: `scaduto da ${-g} gg` };
  if (g === 0) return { tone: "fail", label: "scade oggi" };
  if (g <= 30) return { tone: "wait", label: `tra ${g} gg` };
  return { tone: "info", label: `tra ${g} gg` };
}

type TabKey = "servizio" | "contratto";

export function ScadenzeList({
  items,
  isAdmin,
}: {
  items: ScadenzaItem[];
  isAdmin: boolean;
}) {
  const [aperto, setAperto] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("servizio");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sel = items.find((i) => i.chiave === aperto) ?? null;
  const nServizi = items.filter((i) => i.tipo === "servizio").length;
  const nContratti = items.filter((i) => i.tipo === "contratto").length;
  const visibili = items.filter((i) => i.tipo === tab);

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

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "servizio", label: "Servizi", count: nServizi },
    { key: "contratto", label: "Contratti", count: nContratti },
  ];

  return (
    <>
      <div className="mb-4 inline-flex gap-1 rounded-btn border border-line bg-card-2 p-1">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-field px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                on ? "bg-ink text-on-ink" : "text-text-2 hover:text-text",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-badge px-1.5 py-0.5 text-[11px] font-bold tnum",
                  on ? "bg-white/20 text-on-ink" : "bg-bg-2 text-text-3",
                )}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {visibili.length === 0 ? (
        <EmptyState
          title={tab === "servizio" ? "Nessun servizio in scadenza" : "Nessun contratto in scadenza"}
          hint={
            tab === "servizio"
              ? "Le scadenze dei servizi ricorrenti compaiono qui, ordinate per urgenza."
              : "Le scadenze dei contratti compaiono qui, ordinate per urgenza."
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-crm border border-line bg-card shadow-card">
          {visibili.map((it) => {
            const u = urgenza(it.giorni);
            return (
              <li key={it.chiave}>
                <button
                  type="button"
                  onClick={() => setAperto(it.chiave)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-card-2"
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
                      {it.riferimento ? `Rif. preventivo ${it.riferimento} · ` : ""}
                      {it.titolo} · scade il {dataIt(it.scadenzaIso)}
                    </div>
                  </div>
                  <StatusPill tone={u.tone}>{u.label}</StatusPill>
                </button>
              </li>
            );
          })}
        </ul>
      )}

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
              {sel.riferimento && (
                <Riga label="Rif. preventivo" value={sel.riferimento} />
              )}
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
