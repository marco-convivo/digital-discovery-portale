"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { STATO_META, PIPELINE_COLUMNS, columnForStato } from "@/lib/stati";
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

const DOT: Record<Tone, string> = {
  paid: "bg-paid-dot",
  info: "bg-info-dot",
  wait: "bg-wait-dot",
  fail: "bg-fail-dot",
  draft: "bg-draft-dot",
};
const CHIP_ACTIVE: Record<Tone, string> = {
  paid: "bg-paid-bg text-paid-tx",
  info: "bg-info-bg text-info-tx",
  wait: "bg-wait-bg text-wait-tx",
  fail: "bg-fail-bg text-fail-tx",
  draft: "bg-draft-bg text-draft-tx",
};

function norm(s: string) {
  return s.toLowerCase().trim();
}

export function ClientiList({ clienti }: { clienti: ClienteItem[] }) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<string>("all"); // "all" | column key
  const pathname = usePathname();

  const m = pathname.match(/^\/vendite\/clienti\/([^/]+)/);
  const selectedId = m && m[1] !== "nuovo" ? m[1] : null;

  const bySearch = useMemo(() => {
    const query = norm(q);
    if (!query) return clienti;
    return clienti.filter(
      (c) =>
        norm(c.ragione_sociale).includes(query) ||
        (c.p_iva ? norm(c.p_iva).includes(query) : false),
    );
  }, [q, clienti]);

  // Gruppi (colonne pipeline) presenti nei risultati, con conteggio.
  const gruppi = PIPELINE_COLUMNS.map((col) => ({
    key: col.key,
    label: col.label,
    tone: col.tone,
    count: bySearch.filter((c) => columnForStato(c.stato) === col.key).length,
  })).filter((g) => g.count > 0);

  const filtrati =
    filtro === "all"
      ? bySearch
      : bySearch.filter((c) => columnForStato(c.stato) === filtro);

  return (
    <div
      className={cn(
        "no-scrollbar rounded-card border border-line bg-card p-4",
        "lg:max-h-[calc(100dvh-8.5rem)] lg:overflow-y-auto",
        selectedId && "hidden lg:block",
      )}
    >
      {/* Header fisso: ricerca + filtri di stato */}
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-2 bg-card px-4 pb-2.5 pt-4">
        <div className="relative">
          <SearchIcon />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca cliente o P.IVA…"
            className="w-full rounded-md border border-line bg-card py-2.5 pl-10 pr-3.5 text-sm text-text placeholder:text-text-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet"
          />
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Chip
            label="Tutti"
            n={bySearch.length}
            active={filtro === "all"}
            onClick={() => setFiltro("all")}
          />
          {gruppi.map((g) => (
            <Chip
              key={g.key}
              label={g.label}
              n={g.count}
              tone={g.tone}
              active={filtro === g.key}
              onClick={() => setFiltro(g.key)}
            />
          ))}
        </div>
      </div>

      {filtrati.length === 0 ? (
        <EmptyState
          title={q ? "Nessun cliente trovato" : "Nessun cliente"}
          hint={
            q
              ? "Nessun cliente corrisponde a nome o partita IVA."
              : "Aggiungi un lead dalla Pipeline o un cliente esistente."
          }
        />
      ) : (
        <ul className="flex flex-col gap-0.5">
          {filtrati.map((c) => {
            const meta = STATO_META[c.stato];
            const insoluto = c.insolutoCount > 0;
            const active = c.id === selectedId;
            return (
              <li key={c.id}>
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

function Chip({
  label,
  n,
  tone,
  active,
  onClick,
}: {
  label: string;
  n: number;
  tone?: Tone;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[12px] font-bold transition-colors",
        active
          ? tone
            ? CHIP_ACTIVE[tone]
            : "bg-ink text-on-ink"
          : "bg-card-2 text-text-2 hover:bg-line/60",
      )}
    >
      {tone && (
        <span className={cn("size-1.5 rounded-full", DOT[tone])} />
      )}
      {label}
      <span className={active ? "opacity-60" : "text-text-3"}>{n}</span>
    </button>
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
