import Link from "next/link";
import { ImgPlaceholder } from "@/components/catalogo/placeholder";
import { Prezzo } from "@/components/catalogo/prezzo";
import type { VetrinaServizio } from "@/lib/catalogo/types";

export function ServizioCard({
  v,
  basePath,
}: {
  v: VetrinaServizio;
  basePath: string;
}) {
  const { row, service } = v;
  const badge = service?.ricorrente
    ? "Ricorrente"
    : service?.unaTantum
      ? "Una tantum"
      : "Progetto";
  return (
    <Link
      href={`${basePath}/${row.chiave}`}
      className="group flex flex-col overflow-hidden rounded-card border border-line/60 bg-card shadow-card transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-violet focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-violet/50"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-card-2">
        {row.immagine_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.immagine_url}
            alt={row.titolo}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <ImgPlaceholder label={row.titolo} />
        )}
        <span className="absolute left-3 top-3 rounded-pill bg-card/85 px-2.5 py-1 text-[11px] font-semibold text-text-2 ring-1 ring-line/70 backdrop-blur-sm">
          {badge}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="text-[17px] font-bold tracking-[-0.01em] text-text">
          {row.titolo}
        </h3>
        {row.sottotitolo && (
          <p className="text-[13.5px] leading-snug text-text-2">
            {row.sottotitolo}
          </p>
        )}
        <div className="mt-auto pt-3">
          <Prezzo prezzo={row.prezzo_base} service={service} size="sm" />
        </div>
      </div>
    </Link>
  );
}
