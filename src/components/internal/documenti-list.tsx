"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { euro } from "@/lib/format";

export interface DocServizio {
  label: string;
  importo?: number | null; // per-servizio (in arrivo col catalogo); per ora null
}

export interface DocRow {
  id: string;
  clientName: string;
  clientHref?: string;
  meta: string; // numero · data, oppure "Firmato il …"
  servizi: DocServizio[];
  totale: number | null;
  rata?: number | null; // rata mensile (ricorrente)
  durata?: string | null; // "12 mesi" / "una tantum"
  stato: { tone: Tone; label: string };
  action?: { href: string; label: string; external?: boolean };
  search: string;
}

export function DocumentiList({
  rows,
  placeholder,
  empty,
}: {
  rows: DocRow[];
  placeholder: string;
  empty: string;
}) {
  const [q, setQ] = useState("");
  const query = q.toLowerCase().trim();
  const filtered = useMemo(
    () => (query ? rows.filter((r) => r.search.toLowerCase().includes(query)) : rows),
    [query, rows],
  );

  return (
    <div>
      <div className="relative mb-4">
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
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-line bg-card py-2.5 pl-10 pr-3.5 text-sm text-text placeholder:text-text-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet"
        />
      </div>

      <div className="mb-3 px-1 text-[12.5px] text-text-3">
        {filtered.length}
        {query && ` su ${rows.length}`}
      </div>

      {filtered.length === 0 ? (
        query ? (
          <EmptyState
            title="Nessun risultato"
            hint="Nessuna voce corrisponde alla ricerca."
          />
        ) : (
          <EmptyState title={empty} />
        )
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <article
              key={r.id}
              className="rounded-md border border-line p-4 transition-shadow hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {r.clientHref ? (
                    <Link
                      href={r.clientHref}
                      className="truncate font-bold text-text hover:text-violet"
                    >
                      {r.clientName}
                    </Link>
                  ) : (
                    <div className="truncate font-bold text-text">
                      {r.clientName}
                    </div>
                  )}
                  <div className="mt-0.5 text-[12.5px] text-text-3">{r.meta}</div>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <StatusPill tone={r.stato.tone}>{r.stato.label}</StatusPill>
                  {r.action && (
                    <a
                      href={r.action.href}
                      target={r.action.external ? "_blank" : undefined}
                      rel={r.action.external ? "noopener noreferrer" : undefined}
                      className="text-[13px] font-semibold text-violet hover:underline"
                    >
                      {r.action.label}
                    </a>
                  )}
                </div>
              </div>

              {r.servizi.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
                  {r.servizi.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-baseline justify-between gap-3 text-[13px]"
                    >
                      <span className="text-text">{s.label}</span>
                      {s.importo != null && (
                        <span className="flex-none text-text-2">
                          {euro(s.importo)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
                <span className="text-[12.5px] text-text-3">
                  {r.durata ?? ""}
                </span>
                <div className="text-right">
                  {r.rata != null && (
                    <div className="text-[12.5px] text-text-2">
                      {euro(r.rata)}/mese
                    </div>
                  )}
                  <div className="text-[15px] font-extrabold text-text">
                    Totale {euro(r.totale)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
