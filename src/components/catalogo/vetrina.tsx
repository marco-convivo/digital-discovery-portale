import { ServizioCard } from "@/components/catalogo/servizio-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { VetrinaServizio } from "@/lib/catalogo/types";

export function CatalogoVetrina({
  servizi,
  basePath,
}: {
  servizi: VetrinaServizio[];
  basePath: string;
}) {
  if (servizi.length === 0) {
    return (
      <EmptyState
        title="Catalogo in aggiornamento"
        hint="I servizi saranno disponibili a breve."
      />
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {servizi.map((v) => (
        <ServizioCard key={v.row.id} v={v} basePath={basePath} />
      ))}
    </div>
  );
}
