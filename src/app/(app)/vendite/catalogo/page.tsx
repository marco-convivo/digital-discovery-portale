import Link from "next/link";
import { listServiziInterni } from "@/lib/catalogo/queries";
import type { ServiceCatalogRow } from "@/lib/catalogo/types";
import { CATALOG } from "@/lib/catalog";
import { Card } from "@/components/ui/card";
import { Prezzo } from "@/components/catalogo/prezzo";
import { ImgPlaceholder } from "@/components/catalogo/placeholder";
import { NuovoServizio } from "@/components/internal/nuovo-servizio";

function Riga({ row }: { row: ServiceCatalogRow }) {
  const service = CATALOG.find((c) => c.key === row.chiave) ?? null;
  return (
    <Link href={`/vendite/catalogo/${row.chiave}`}>
      <Card className="flex items-center gap-3 transition-colors hover:border-line-strong">
        <div className="h-12 w-16 flex-none overflow-hidden rounded-field border border-line bg-card-2">
          {row.immagine_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.immagine_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImgPlaceholder />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-text">{row.titolo}</div>
          <div className="mt-0.5">
            <Prezzo prezzo={row.prezzo_base} service={service} size="sm" />
          </div>
        </div>
        {/* Stato: due concetti distinti */}
        <div className="flex flex-none flex-col items-end gap-1">
          <StatoBadge on={row.in_vetrina} onLabel="in vetrina" offLabel="nascosto" tone="mint" />
          <StatoBadge on={row.vendibile} onLabel="vendibile" offLabel="non vendibile" tone="info" />
        </div>
      </Card>
    </Link>
  );
}

function StatoBadge({
  on,
  onLabel,
  offLabel,
  tone,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  tone: "mint" | "info";
}) {
  if (!on)
    return (
      <span className="rounded-badge bg-bg-2 px-2 py-0.5 text-[11px] font-semibold text-text-3">
        {offLabel}
      </span>
    );
  return (
    <span
      className={
        tone === "mint"
          ? "rounded-badge bg-mint-soft px-2 py-0.5 text-[11px] font-semibold text-on-mint"
          : "rounded-badge bg-violet-soft px-2 py-0.5 text-[11px] font-semibold text-info-tx"
      }
    >
      {onLabel}
    </span>
  );
}

export default async function CatalogoAdminPage() {
  const servizi = await listServiziInterni();
  const inVetrina = servizi.filter((s) => s.in_vetrina);
  const nascosti = servizi.filter((s) => !s.in_vetrina);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
            Catalogo servizi
          </h1>
          <p className="mt-0.5 text-sm text-text-2">
            Ordine, visibilità in vetrina e disponibilità nei preventivi di
            ciascun servizio. L&apos;ordine si imposta nella scheda del servizio.
          </p>
        </div>
        <NuovoServizio />
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {inVetrina.map((row) => (
          <Riga key={row.id} row={row} />
        ))}
      </div>

      {nascosti.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-[13px] font-bold uppercase tracking-wide text-text-3">
            Nascosti dalla vetrina
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {nascosti.map((row) => (
              <Riga key={row.id} row={row} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
