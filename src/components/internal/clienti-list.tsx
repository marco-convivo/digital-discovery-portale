"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { STATO_META } from "@/lib/stati";
import { cn } from "@/lib/utils";
import type { ClientStato } from "@/lib/types";

export interface ClienteItem {
  id: string;
  ragione_sociale: string;
  p_iva: string | null;
  referente: string | null;
  email: string | null;
  telefono: string | null;
  stato: ClientStato;
  owner_name: string | null;
  insolutoCount: number;
  insolutoPaymentId: string | null;
}

function norm(s: string) {
  return s.toLowerCase().trim();
}

export function ClientiList({ clienti }: { clienti: ClienteItem[] }) {
  const [q, setQ] = useState("");

  const filtrati = useMemo(() => {
    const query = norm(q);
    if (!query) return clienti;
    return clienti.filter(
      (c) =>
        norm(c.ragione_sociale).includes(query) ||
        (c.p_iva ? norm(c.p_iva).includes(query) : false),
    );
  }, [q, clienti]);

  return (
    <div>
      <div className="relative mb-4">
        <SearchIcon />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca per ragione sociale o partita IVA…"
          className="w-full rounded-md border border-line bg-card py-2.5 pl-10 pr-3.5 text-sm text-text placeholder:text-text-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet"
        />
      </div>

      <div className="mb-2 px-1 text-[12.5px] text-text-3">
        {filtrati.length}{" "}
        {filtrati.length === 1 ? "cliente" : "clienti"}
        {q && ` su ${clienti.length}`}
      </div>

      {filtrati.length === 0 ? (
        q ? (
          <EmptyState
            title="Nessun cliente trovato"
            hint="Nessun cliente corrisponde a nome o partita IVA."
          />
        ) : (
          <EmptyState
            title="Ancora nessun cliente acquisito"
            hint="I clienti compaiono qui quando firmano il contratto."
          />
        )
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {filtrati.map((c) => {
            const meta = STATO_META[c.stato];
            const insoluto = c.insolutoCount > 0;
            return (
              <li
                key={c.id}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-card-2",
                  insoluto && "bg-fail-bg/25",
                )}
              >
                {/* stretched link: tutta la riga apre la scheda cliente */}
                <Link
                  href={`/vendite/clienti/${c.id}`}
                  aria-label={c.ragione_sociale}
                  className="absolute inset-0 rounded-md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold text-text">
                      {c.ragione_sociale}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-[12.5px] text-text-3">
                    {c.p_iva && <span>P.IVA {c.p_iva}</span>}
                    {c.referente && <span>{c.referente}</span>}
                    {c.email && <span className="truncate">{c.email}</span>}
                  </div>
                </div>
                <div className="relative z-10 flex flex-none items-center gap-2.5">
                  {insoluto && c.insolutoPaymentId && (
                    <Link
                      href={`/vendite/insoluti?p=${c.insolutoPaymentId}`}
                      className="inline-flex items-center gap-1.5 rounded-pill bg-fail-bg px-2.5 py-1 text-[12px] font-bold text-fail-tx transition-colors hover:bg-fail-tx hover:text-white"
                    >
                      <span className="size-1.5 rounded-full bg-fail-dot" />
                      {c.insolutoCount === 1
                        ? "Insoluto"
                        : `${c.insolutoCount} insoluti`}
                      <span aria-hidden>→</span>
                    </Link>
                  )}
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  <span className="text-text-3" aria-hidden>
                    ›
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-text-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
