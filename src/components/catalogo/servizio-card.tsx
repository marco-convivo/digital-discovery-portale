import Link from "next/link";
import { ServizioGlyph } from "@/components/catalogo/servizio-glyph";
import { euro } from "@/lib/format";
import { categoria, suffissoPrezzo, TONE_BADGE } from "@/lib/catalogo/ui";
import { cn } from "@/lib/utils";
import type { VetrinaServizio } from "@/lib/catalogo/types";

export function ServizioCard({
  v,
  basePath,
}: {
  v: VetrinaServizio;
  basePath: string;
}) {
  const { row, service } = v;
  const cat = categoria(service);
  const suffisso = suffissoPrezzo(service);
  return (
    <Link
      href={`${basePath}/${row.chiave}`}
      className="group flex flex-col overflow-hidden rounded-card border border-white/70 bg-white/55 shadow-[0_16px_44px_-18px_rgba(37,99,235,0.4)] ring-1 ring-white/40 backdrop-blur-xl transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/72 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blue-400/50"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {row.immagine_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.immagine_url}
            alt={row.titolo}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="grid h-full w-full place-items-center"
            style={{ background: "linear-gradient(160deg,#eff5ff 0%,#dbe8ff 100%)" }}
          >
            <ServizioGlyph
              chiave={row.chiave}
              className="size-[58%] transition-transform duration-300 ease-out group-hover:scale-105"
            />
          </div>
        )}
        <span
          className={cn(
            "absolute left-3 top-3 rounded-pill px-2.5 py-1 text-[11px] font-bold backdrop-blur",
            TONE_BADGE[cat.tone],
          )}
        >
          {cat.label}
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
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="leading-tight">
            {row.prezzo_base != null ? (
              <>
                <span className="block text-[11px] font-medium text-text-3">
                  a partire da
                </span>
                <span className="text-xl font-extrabold tracking-[-0.01em] text-text">
                  {euro(row.prezzo_base)}
                </span>
                {suffisso && (
                  <span className="text-[12px] font-medium text-text-3">
                    {" "}
                    {suffisso}
                  </span>
                )}
                <span className="block text-[10px] font-medium text-text-3">
                  IVA esclusa
                </span>
              </>
            ) : (
              <span className="text-[13px] font-semibold text-text-2">
                Su richiesta
              </span>
            )}
          </div>
          <span
            aria-hidden
            className="grid size-8 flex-none place-items-center rounded-full bg-white/70 text-text-2 shadow-sm transition-colors group-hover:bg-blue-500 group-hover:text-white"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
