"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { STATO_META } from "@/lib/stati";
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
        <div className="rounded-md border border-dashed border-line px-3 py-10 text-center text-sm text-text-3">
          {q
            ? "Nessun cliente corrisponde alla ricerca."
            : "Nessun cliente acquisito ancora."}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {filtrati.map((c) => {
            const meta = STATO_META[c.stato];
            return (
              <li key={c.id}>
                <Link
                  href={`/vendite/clienti/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors hover:bg-card-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-bold text-text">
                      {c.ragione_sociale}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-[12.5px] text-text-3">
                      {c.p_iva && <span>P.IVA {c.p_iva}</span>}
                      {c.referente && <span>{c.referente}</span>}
                      {c.email && <span className="truncate">{c.email}</span>}
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-3">
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                    <span className="text-text-3">›</span>
                  </div>
                </Link>
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
