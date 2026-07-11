import Link from "next/link";
import { ImgPlaceholder } from "@/components/catalogo/placeholder";
import { PortfolioGallery } from "@/components/catalogo/portfolio-gallery";
import { euro } from "@/lib/format";
import {
  categoria,
  suffissoPrezzo,
  TONE_BADGE_DARK,
} from "@/lib/catalogo/ui";
import { cn } from "@/lib/utils";
import type { VetrinaServizio } from "@/lib/catalogo/types";

type Accent = "mint" | "violet" | "muted";

function Blocco({
  titolo,
  voci,
  accent,
}: {
  titolo: string;
  voci: string[];
  accent: Accent;
}) {
  if (voci.length === 0) return null;
  const dot =
    accent === "mint" ? "bg-mint" : accent === "violet" ? "bg-violet" : "bg-text-3";
  const mark =
    accent === "mint"
      ? "text-on-mint"
      : accent === "violet"
        ? "text-on-violet"
        : "text-text-3";
  const glyph = accent === "muted" ? "–" : "✓";
  return (
    <div
      className={cn(
        "rounded-card border border-line/60 p-5 shadow-card",
        accent === "muted" ? "bg-card-2" : "bg-card",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", dot)} />
        <h3 className="text-[15px] font-bold text-text">{titolo}</h3>
      </div>
      <ul className="flex flex-col gap-2 text-[14px] text-text-2">
        {voci.map((v, i) => (
          <li key={i} className="flex gap-2.5">
            <span className={cn("font-bold", mark)}>{glyph}</span>
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
  const cat = categoria(service);
  const suffisso = suffissoPrezzo(service);
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={basePath}
        className="text-[13px] font-semibold text-text-2 hover:text-text"
      >
        ← Catalogo
      </Link>

      <div className="mt-4 overflow-hidden rounded-card border border-line/60 shadow-card">
        <div className="aspect-[21/9]">
          {row.immagine_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.immagine_url}
              alt={row.titolo}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImgPlaceholder label={row.titolo} tone={cat.tone} />
          )}
        </div>

        {/* Pannello commerciale scuro: prezzo in risalto + CTA */}
        <div className="bg-ink p-6 text-on-ink sm:p-7">
          <span
            className={cn(
              "inline-flex rounded-pill px-3 py-1 text-[12px] font-bold",
              TONE_BADGE_DARK[cat.tone],
            )}
          >
            {cat.label}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-balance">
            {row.titolo}
          </h1>
          {row.sottotitolo && (
            <p className="mt-1 text-[15px] text-on-ink/70">{row.sottotitolo}</p>
          )}

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div className="leading-tight">
              {row.prezzo_base != null ? (
                <>
                  <span className="block text-[12px] font-medium text-on-ink/60">
                    a partire da
                  </span>
                  <span className="text-4xl font-extrabold tracking-[-0.02em]">
                    {euro(row.prezzo_base)}
                  </span>
                  {suffisso && (
                    <span className="text-[14px] font-medium text-on-ink/60">
                      {" "}
                      {suffisso}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-lg font-bold">Prezzo su richiesta</span>
              )}
            </div>
            <Link
              href={ctaHref}
              className="rounded-pill bg-mint px-5 py-2.5 text-[14px] font-bold text-on-mint transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mint/50"
            >
              Richiedi preventivo →
            </Link>
          </div>
        </div>
      </div>

      {row.descrizione && (
        <p className="mt-6 max-w-[65ch] text-[15px] leading-relaxed text-pretty text-text-2">
          {row.descrizione}
        </p>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Blocco titolo="Cosa facciamo" voci={row.attivita_incluse} accent="mint" />
        <Blocco titolo="Come lavoriamo" voci={row.condizioni} accent="violet" />
        <Blocco
          titolo="Cosa non è incluso"
          voci={row.attivita_escluse}
          accent="muted"
        />
      </div>

      <PortfolioGallery items={portfolio} />
    </div>
  );
}
