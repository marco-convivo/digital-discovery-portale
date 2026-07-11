import { ImgPlaceholder } from "@/components/catalogo/placeholder";
import type { PortfolioItemRow } from "@/lib/catalogo/types";

export function PortfolioGallery({ items }: { items: PortfolioItemRow[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-extrabold tracking-[-0.01em] text-text">
        Lavori realizzati
      </h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((it) => (
          <article
            key={it.id}
            className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card"
          >
            <div className="aspect-[16/9]">
              {it.immagine_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.immagine_url} alt={it.titolo}
                  className="h-full w-full object-cover" />
              ) : (
                <ImgPlaceholder label={it.titolo} />
              )}
            </div>
            <div className="flex flex-col gap-1.5 p-5">
              <div className="flex items-center gap-2 text-[12px] text-text-3">
                {it.cliente && <span className="font-semibold text-text-2">{it.cliente}</span>}
                {it.settore && <span>· {it.settore}</span>}
              </div>
              <h3 className="text-[15px] font-bold text-text">{it.titolo}</h3>
              {it.descrizione && (
                <p className="text-[13.5px] leading-relaxed text-text-2">
                  {it.descrizione}
                </p>
              )}
              {it.risultato && (
                <p className="mt-1 inline-flex w-fit rounded-pill bg-mint-soft px-2.5 py-1 text-[12.5px] font-semibold text-text">
                  {it.risultato}
                </p>
              )}
              {it.link_url && (
                <a href={it.link_url} target="_blank" rel="noopener noreferrer"
                  className="mt-1 text-[13px] font-semibold text-violet hover:underline">
                  Vedi il lavoro →
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
