"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";

export interface MasterItem {
  id: string;
  ragione_sociale: string;
  count: number;
}

// Colonna sinistra dei master-detail: ricerca + lista clienti selezionabile.
export function MasterClientiList({
  items,
  selected,
  onSelect,
}: {
  items: MasterItem[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const query = q.toLowerCase().trim();
  const filtrati = useMemo(
    () =>
      query
        ? items.filter((c) => c.ragione_sociale.toLowerCase().includes(query))
        : items,
    [query, items],
  );

  return (
    <Card className="p-3 lg:sticky lg:top-6">
      <div className="relative mb-2">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 size-[17px] -translate-y-1/2 text-text-3"
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
          placeholder="Cerca cliente…"
          className="w-full rounded-md border border-line bg-card py-2 pl-9 pr-3 text-[13.5px] text-text placeholder:text-text-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet"
        />
      </div>
      {filtrati.length === 0 ? (
        <p className="px-2 py-6 text-center text-[13px] text-text-3">
          Nessun cliente.
        </p>
      ) : (
        <ul className="flex max-h-[65vh] flex-col gap-0.5 overflow-y-auto">
          {filtrati.map((c) => {
            const active = c.id === selected;
            return (
              <li key={c.id}>
                <button
                  onClick={() => onSelect(c.id)}
                  className={
                    "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[13.5px] transition-colors " +
                    (active
                      ? "bg-ink text-on-ink"
                      : "text-text-2 hover:bg-card-2 hover:text-text")
                  }
                >
                  <span className="truncate font-semibold">
                    {c.ragione_sociale}
                  </span>
                  <span
                    className={
                      "flex-none rounded-pill px-1.5 text-[11px] font-bold " +
                      (active ? "bg-on-ink/20" : "bg-card-2 text-text-3")
                    }
                  >
                    {c.count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
