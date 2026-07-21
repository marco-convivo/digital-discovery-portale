"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  // Cliente selezionato dall'URL (/vendite/clienti/<id>, escluso "nuovo").
  const m = pathname.match(/^\/vendite\/clienti\/([^/]+)/);
  const selectedId = m && m[1] !== "nuovo" ? m[1] : null;

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
    <div
      className={cn(
        "rounded-card border border-line bg-card p-4",
        "lg:max-h-[calc(100dvh-8.5rem)] lg:overflow-y-auto",
        // su mobile, quando una scheda è aperta, la lista lascia spazio
        selectedId && "hidden lg:block",
      )}
    >
      <div className="relative mb-4">
        <SearchIcon />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca cliente o P.IVA…"
          className="w-full rounded-md border border-line bg-card py-2.5 pl-10 pr-3.5 text-sm text-text placeholder:text-text-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet"
        />
      </div>

      <div className="mb-2 px-1 text-[12.5px] text-text-3">
        {filtrati.length} {filtrati.length === 1 ? "cliente" : "clienti"}
        {q && ` su ${clienti.length}`}
      </div>

      {filtrati.length === 0 ? (
        <EmptyState
          title={q ? "Nessun cliente trovato" : "Ancora nessun cliente"}
          hint={
            q
              ? "Nessun cliente corrisponde a nome o partita IVA."
              : "I clienti compaiono qui quando firmano il contratto."
          }
        />
      ) : (
        <ul className="flex flex-col gap-0.5">
          {filtrati.map((c) => {
            const meta = STATO_META[c.stato];
            const insoluto = c.insolutoCount > 0;
            const active = c.id === selectedId;
            return (
              <li key={c.id} className="relative">
                <Link
                  href={`/vendite/clienti/${c.id}`}
                  className={cn(
                    "block rounded-md px-3 py-2.5 transition-colors",
                    active ? "bg-ink/[0.06]" : "hover:bg-card-2",
                    insoluto && !active && "bg-fail-bg/30",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-bold text-text">
                      {c.ragione_sociale}
                    </span>
                    {insoluto && (
                      <span className="size-1.5 flex-none rounded-full bg-fail-dot" />
                    )}
                  </div>
                  {c.referente && (
                    <div className="mt-0.5 truncate text-[12px] text-text-3">
                      {c.referente}
                    </div>
                  )}
                  <div className="mt-1.5">
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
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
