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
    <div className="relative">
      {/* Backdrop a gradiente blu: dà "materia" al vetro delle schede */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-16 -top-8 size-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(63,130,255,0.28), transparent 70%)" }}
        />
        <div
          className="absolute right-0 top-1/3 size-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.20), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-10 left-1/3 size-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)" }}
        />
      </div>
      <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {servizi.map((v) => (
          <ServizioCard key={v.row.id} v={v} basePath={basePath} />
        ))}
      </div>
    </div>
  );
}
