import Link from "next/link";
import { listServiziInterni } from "@/lib/catalogo/queries";
import { CATALOG } from "@/lib/catalog";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Prezzo } from "@/components/catalogo/prezzo";

export default async function CatalogoAdminPage() {
  const servizi = await listServiziInterni();
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Catalogo servizi
        </h1>
        <p className="mt-0.5 text-sm text-text-2">
          Gestisci contenuti, prezzo, immagine e portfolio di ciascun servizio.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {servizi.map((row) => {
          const service = CATALOG.find((c) => c.key === row.chiave) ?? null;
          return (
            <Link key={row.id} href={`/vendite/catalogo/${row.chiave}`}>
              <Card className="flex items-center justify-between gap-3 transition-colors hover:border-violet">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text">{row.titolo}</span>
                    {!row.attivo && <StatusPill tone="draft">nascosto</StatusPill>}
                  </div>
                  <div className="mt-0.5">
                    <Prezzo prezzo={row.prezzo_base} service={service} size="sm" />
                  </div>
                </div>
                <span className="text-[13px] font-semibold text-violet">Modifica →</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
