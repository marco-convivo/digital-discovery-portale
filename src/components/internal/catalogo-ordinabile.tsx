"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { salvaOrdineCatalogo } from "@/lib/catalogo/actions";
import { CATALOG } from "@/lib/catalog";
import type { ServiceCatalogRow } from "@/lib/catalogo/types";
import { Prezzo } from "@/components/catalogo/prezzo";
import { ImgPlaceholder } from "@/components/catalogo/placeholder";
import { cn } from "@/lib/utils";

function Badge({
  on,
  onLabel,
  offLabel,
  tone,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  tone: "mint" | "info";
}) {
  if (!on)
    return (
      <span className="rounded-badge bg-bg-2 px-2 py-0.5 text-[11px] font-semibold text-text-3">
        {offLabel}
      </span>
    );
  return (
    <span
      className={cn(
        "rounded-badge px-2 py-0.5 text-[11px] font-semibold",
        tone === "mint" ? "bg-mint-soft text-on-mint" : "bg-violet-soft text-info-tx",
      )}
    >
      {onLabel}
    </span>
  );
}

function Riga({
  row,
  reorder,
  children,
}: {
  row: ServiceCatalogRow;
  reorder?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const service = CATALOG.find((c) => c.key === row.chiave) ?? null;
  return (
    <div className="flex items-center gap-3 border-b border-line-soft px-3 py-2.5 last:border-b-0">
      {reorder}
      <div className="h-11 w-16 flex-none overflow-hidden rounded-field border border-line bg-card-2">
        {row.immagine_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.immagine_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImgPlaceholder />
        )}
      </div>
      <Link href={`/vendite/catalogo/${row.chiave}`} className="min-w-0 flex-1">
        <div className="truncate font-bold text-text">{row.titolo}</div>
        <div className="mt-0.5">
          <Prezzo prezzo={row.prezzo_base} service={service} size="sm" />
        </div>
      </Link>
      <div className="flex flex-none items-center gap-1.5">
        <Badge on={row.in_vetrina} onLabel="in vetrina" offLabel="nascosto" tone="mint" />
        <Badge on={row.vendibile} onLabel="vendibile" offLabel="non vendibile" tone="info" />
      </div>
      {children}
    </div>
  );
}

export function CatalogoOrdinabile({
  inVetrina,
  nascosti,
  isAdmin,
}: {
  inVetrina: ServiceCatalogRow[];
  nascosti: ServiceCatalogRow[];
  isAdmin: boolean;
}) {
  const [ordine, setOrdine] = useState(inVetrina);
  const [drag, setDrag] = useState<number | null>(null);
  const [, start] = useTransition();

  function persisti(next: ServiceCatalogRow[]) {
    setOrdine(next);
    start(() => {
      void salvaOrdineCatalogo(next.map((r) => r.chiave));
    });
  }
  function muovi(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= ordine.length) return;
    const next = [...ordine];
    [next[i], next[j]] = [next[j], next[i]];
    persisti(next);
  }
  function drop(to: number) {
    if (drag === null || drag === to) return setDrag(null);
    const next = [...ordine];
    const [moved] = next.splice(drag, 1);
    next.splice(to, 0, moved);
    setDrag(null);
    persisti(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-crm border border-line bg-card">
        {ordine.map((row, i) => (
          <div
            key={row.id}
            draggable={isAdmin}
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(i)}
            className={cn(drag === i && "opacity-50")}
          >
            <Riga
              row={row}
              reorder={
                isAdmin ? (
                  <span
                    className="flex-none cursor-grab text-text-3"
                    aria-hidden
                    title="Trascina per riordinare"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                      <circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" />
                      <circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" />
                      <circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" />
                    </svg>
                  </span>
                ) : undefined
              }
            >
              {isAdmin && (
                <div className="flex flex-none flex-col">
                  <button
                    type="button"
                    onClick={() => muovi(i, -1)}
                    disabled={i === 0}
                    aria-label="Sposta su"
                    className="grid size-5 place-items-center text-text-3 hover:text-text disabled:opacity-30"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => muovi(i, 1)}
                    disabled={i === ordine.length - 1}
                    aria-label="Sposta giù"
                    className="grid size-5 place-items-center text-text-3 hover:text-text disabled:opacity-30"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                </div>
              )}
            </Riga>
          </div>
        ))}
        {ordine.length === 0 && (
          <p className="px-3 py-6 text-center text-[13px] text-text-3">
            Nessun servizio in vetrina.
          </p>
        )}
      </div>

      {nascosti.length > 0 && (
        <div>
          <h2 className="mb-2 text-[13px] font-bold text-text-3">
            Nascosti dalla vetrina
          </h2>
          <div className="overflow-hidden rounded-crm border border-line bg-card">
            {nascosti.map((row) => (
              <Riga key={row.id} row={row} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
