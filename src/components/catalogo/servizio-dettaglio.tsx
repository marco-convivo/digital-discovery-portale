import Link from "next/link";
import { ImgPlaceholder } from "@/components/catalogo/placeholder";
import { Prezzo } from "@/components/catalogo/prezzo";
import { PortfolioGallery } from "@/components/catalogo/portfolio-gallery";
import type { VetrinaServizio } from "@/lib/catalogo/types";

function Blocco({ titolo, voci, tono }: { titolo: string; voci: string[]; tono?: "escluse" }) {
  if (voci.length === 0) return null;
  return (
    <div className="rounded-card border border-line/60 bg-card p-5 shadow-card">
      <h3 className="mb-3 text-[15px] font-bold text-text">{titolo}</h3>
      <ul className="flex flex-col gap-2 text-[14px] text-text-2">
        {voci.map((v, i) => (
          <li key={i} className="flex gap-2.5">
            <span className={tono === "escluse" ? "text-text-3" : "text-violet"}>
              {tono === "escluse" ? "–" : "✓"}
            </span>
            <span>{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServizioDettaglio({
  v,
  basePath,
  ctaHref,
}: {
  v: VetrinaServizio;
  basePath: string;
  ctaHref: string;
}) {
  const { row, service, portfolio } = v;
  return (
    <div className="mx-auto max-w-4xl">
      <Link href={basePath} className="text-[13px] font-semibold text-text-2 hover:text-text">
        ← Catalogo
      </Link>

      <div className="mt-4 overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
        <div className="aspect-[21/9]">
          {row.immagine_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.immagine_url} alt={row.titolo} className="h-full w-full object-cover" />
          ) : (
            <ImgPlaceholder label={row.titolo} />
          )}
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
            {row.titolo}
          </h1>
          {row.sottotitolo && (
            <p className="mt-1 text-[15px] text-text-2">{row.sottotitolo}</p>
          )}
          {row.descrizione && (
            <p className="mt-4 max-w-[65ch] text-[15px] leading-relaxed text-text-2">
              {row.descrizione}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <Prezzo prezzo={row.prezzo_base} service={service} />
            <Link
              href={ctaHref}
              className="rounded-pill bg-ink px-5 py-2.5 text-[14px] font-semibold text-on-ink transition-opacity hover:opacity-90"
            >
              Richiedi preventivo
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Blocco titolo="Cosa facciamo" voci={row.attivita_incluse} />
        <Blocco titolo="Come lavoriamo" voci={row.condizioni} />
        <Blocco titolo="Cosa non è incluso" voci={row.attivita_escluse} tono="escluse" />
      </div>

      <PortfolioGallery items={portfolio} />
    </div>
  );
}
