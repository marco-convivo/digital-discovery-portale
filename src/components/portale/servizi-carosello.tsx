import { ServiceCard } from "@/components/catalogo/service-card";
import { iconForChiave } from "@/lib/catalogo/service-icons";
import type { VetrinaServizio } from "@/lib/catalogo/types";

// Carosello orizzontale di servizi (cross-sell) — riusa la ServiceCard scura.
export function ServiziCarosello({
  servizi,
  basePath,
}: {
  servizi: VetrinaServizio[];
  basePath: string;
}) {
  if (servizi.length === 0) return null;
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-3 [scrollbar-width:thin]">
      {servizi.map((v) => (
        <div
          key={v.row.id}
          className="w-[270px] flex-none snap-start sm:w-[290px]"
        >
          <ServiceCard
            icon={iconForChiave(v.row.chiave)}
            title={v.row.titolo}
            description={v.row.sottotitolo ?? v.row.descrizione ?? ""}
            href={`${basePath}/${v.row.chiave}`}
          />
        </div>
      ))}
    </div>
  );
}
