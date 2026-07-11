"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";

export interface EntityRow {
  id: string;
  title: string;
  subtitle?: string;
  href?: string; // link (di solito alla scheda cliente)
  search: string; // testo su cui filtrare
  pill?: { tone: Tone; label: string };
  tags?: string[]; // chip informativi (es. servizi acquistati)
  action?: { href: string; label: string; external?: boolean };
}

export function EntityList({
  rows,
  placeholder,
  empty,
}: {
  rows: EntityRow[];
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

      <div className="mb-2 px-1 text-[12.5px] text-text-3">
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
        <ul className="flex flex-col divide-y divide-line">
          {filtered.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                {r.href ? (
                  <Link
                    href={r.href}
                    className="truncate font-bold text-text hover:text-violet"
                  >
                    {r.title}
                  </Link>
                ) : (
                  <div className="truncate font-bold text-text">{r.title}</div>
                )}
                {r.subtitle && (
                  <div className="mt-0.5 truncate text-[12.5px] text-text-3">
                    {r.subtitle}
                  </div>
                )}
                {r.tags && r.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {r.tags.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-pill bg-card-2 px-2 py-0.5 text-[11.5px] font-medium text-text-2"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-none items-center gap-3">
                {r.pill && <StatusPill tone={r.pill.tone}>{r.pill.label}</StatusPill>}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
