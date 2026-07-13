import { ServizioCard } from "@/components/catalogo/servizio-card";
import type { VetrinaServizio } from "@/lib/catalogo/types";

// Carosello orizzontale di servizi (cross-sell) — riusa le card della vetrina.
export function ServiziCarosello({
  servizi,
  basePath,
}: {
  servizi: VetrinaServizio[];
  basePath: string;
}) {
  if (servizi.length === 0) return null;
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
      {servizi.map((v) => (
        <div
          key={v.row.id}
          className="w-[260px] flex-none snap-start sm:w-[280px]"
        >
          <ServizioCard v={v} basePath={basePath} />
        </div>
      ))}
    </div>
  );
}
