"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { PAYMENT_STATO_META } from "@/lib/stati";
import { euro, dataBreve } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CassaBucket } from "@/lib/cassa/queries";

const LIMITE_OLTRE = 5; // "Più avanti": mostra questi, poi "mostra di più"

export function CalendarioBuckets({ buckets }: { buckets: CassaBucket[] }) {
  const [mostraOltre, setMostraOltre] = useState(false);

  if (buckets.length === 0) {
    return (
      <div className="rounded-crm border border-line bg-card p-8 text-center">
        <p className="text-[15px] font-bold text-text">Nessuna rata in arrivo</p>
        <p className="mt-1 text-[13px] text-text-2">
          Le rate programmate compaiono qui, dalla più vicina.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-crm border border-line bg-card">
      {buckets.map((b) => {
        const limitabile = b.key === "oltre" && b.items.length > LIMITE_OLTRE;
        const visibili =
          limitabile && !mostraOltre ? b.items.slice(0, LIMITE_OLTRE) : b.items;
        return (
          <div key={b.key}>
            <div
              className={cn(
                "flex items-center justify-between border-b border-line bg-card-2 px-4 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide",
                b.ritardo ? "text-fail-tx" : "text-text-2",
              )}
            >
              <span className="flex items-center gap-2">
                {b.ritardo && <span className="size-1.5 rounded-full bg-fail-dot" />}
                {b.label} · {b.items.length}
              </span>
              <span className="tnum normal-case">{euro(b.totale)}</span>
            </div>

            {visibili.map((r) => {
              const meta = PAYMENT_STATO_META[r.stato];
              return (
                <Link
                  key={r.id}
                  href={`/vendite/clienti/${r.clientId}`}
                  className={cn(
                    "grid grid-cols-[2.4fr_1fr_1.2fr_1.2fr] items-center border-b border-line-soft px-4 py-2.5 text-[13px] last:border-b-0",
                    b.ritardo ? "bg-fail-bg/45 hover:bg-fail-bg/70" : "hover:bg-card-2",
                  )}
                >
                  <span className="truncate font-bold text-text">
                    {r.ragioneSociale}
                  </span>
                  <span className="text-text-3">Rata {r.numeroRata ?? "—"}</span>
                  <span className="tnum font-bold text-text">{euro(r.importo)}</span>
                  <span className="flex items-center justify-end gap-2.5">
                    <span className={cn(b.ritardo ? "font-semibold text-fail-tx" : "text-text-3")}>
                      {dataBreve(r.scadenza)}
                    </span>
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  </span>
                </Link>
              );
            })}

            {limitabile && (
              <button
                type="button"
                onClick={() => setMostraOltre((v) => !v)}
                className="w-full border-b border-line-soft px-4 py-2.5 text-left text-[12.5px] font-semibold text-link hover:bg-card-2"
              >
                {mostraOltre
                  ? "Mostra meno"
                  : `Mostra altre ${b.items.length - LIMITE_OLTRE} rate`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
