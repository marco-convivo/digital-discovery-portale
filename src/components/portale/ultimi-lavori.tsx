import { ServizioGlyph } from "@/components/catalogo/servizio-glyph";
import type { LavoroItem } from "@/lib/catalogo/queries";

function LavoroCard({ l }: { l: LavoroItem }) {
  const inner = (
    <>
      <div className="aspect-[16/10] overflow-hidden">
        {l.immagine_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={l.immagine_url}
            alt={l.titolo}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="grid h-full w-full place-items-center"
            style={{ background: "linear-gradient(160deg,#eff5ff 0%,#dbe8ff 100%)" }}
          >
            <ServizioGlyph
              chiave={l.servizioChiave ?? "sito"}
              className="size-[52%] transition-transform duration-300 ease-out group-hover:scale-105"
            />
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] font-semibold uppercase tracking-wide text-text-3">
          {l.settore && <span>{l.settore}</span>}
          {l.settore && l.servizioTitolo && <span aria-hidden>·</span>}
          {l.servizioTitolo && <span className="text-violet">{l.servizioTitolo}</span>}
        </div>
        <h3 className="mt-1.5 text-[17px] font-bold leading-snug tracking-[-0.01em] text-text">
          {l.titolo}
        </h3>
        {l.risultato && (
          <p className="mt-1.5 text-[13.5px] font-semibold text-on-mint">
            {l.risultato}
          </p>
        )}
        {l.descrizione && (
          <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-text-2">
            {l.descrizione}
          </p>
        )}
        {(l.cliente || l.link_url) && (
          <div className="mt-3 flex items-center justify-between text-[12.5px]">
            {l.cliente ? (
              <span className="font-medium text-text-3">{l.cliente}</span>
            ) : (
              <span />
            )}
            {l.link_url && (
              <span className="font-semibold text-violet group-hover:underline">
                Vedi il lavoro →
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const cls =
    "group block overflow-hidden rounded-card border border-white/70 bg-white/55 shadow-[0_16px_44px_-18px_rgba(37,99,235,0.4)] ring-1 ring-white/40 backdrop-blur-xl transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/72";

  return l.link_url ? (
    <a href={l.link_url} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function UltimiLavori({
  lavori,
  columns = 2,
}: {
  lavori: LavoroItem[];
  columns?: 2 | 3;
}) {
  if (lavori.length === 0) return null;
  const grid =
    columns === 3
      ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      : "grid gap-5 sm:grid-cols-2";
  return (
    <div className={grid}>
      {lavori.map((l) => (
        <LavoroCard key={l.id} l={l} />
      ))}
    </div>
  );
}
