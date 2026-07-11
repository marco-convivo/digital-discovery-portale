import Link from "next/link";
import { notFound } from "next/navigation";
import { getServizioInterno } from "@/lib/catalogo/queries";
import { CatalogoEditor } from "@/components/internal/catalogo-editor";
import { PortfolioManager } from "@/components/internal/portfolio-manager";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CatalogoEditPage({
  params,
}: {
  params: Promise<{ chiave: string }>;
}) {
  const { chiave } = await params;
  const v = await getServizioInterno(chiave);
  if (!v) notFound();
  const { row, portfolio } = v;
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/vendite/catalogo" className="text-[13px] font-semibold text-text-2 hover:text-text">
        ← Catalogo
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        {row.titolo}
      </h1>
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader><CardTitle>Contenuti e prezzo</CardTitle></CardHeader>
          <CatalogoEditor
            chiave={chiave}
            immagineUrl={row.immagine_url}
            initial={{
              titolo: row.titolo,
              sottotitolo: row.sottotitolo ?? "",
              descrizione: row.descrizione ?? "",
              attivita_incluse: row.attivita_incluse.join("\n"),
              condizioni: row.condizioni.join("\n"),
              attivita_escluse: row.attivita_escluse.join("\n"),
              prezzo_base: row.prezzo_base,
              ordine: row.ordine,
              attivo: row.attivo,
            }}
          />
        </Card>
        <Card>
          <CardHeader><CardTitle>Portfolio</CardTitle></CardHeader>
          <PortfolioManager serviceId={row.id} initial={portfolio} />
        </Card>
      </div>
    </div>
  );
}
