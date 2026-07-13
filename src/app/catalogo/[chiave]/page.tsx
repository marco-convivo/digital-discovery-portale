import { notFound } from "next/navigation";
import { getServizioPubblico } from "@/lib/catalogo/queries";
import { ServizioDettaglio } from "@/components/catalogo/servizio-dettaglio";

const MAILTO =
  "mailto:info@digital-discovery.it?subject=Richiesta%20preventivo";

export default async function ServizioPubblicoPage({
  params,
}: {
  params: Promise<{ chiave: string }>;
}) {
  const { chiave } = await params;
  const v = await getServizioPubblico(chiave);
  if (!v) notFound();
  return (
    <main className="px-6 py-12">
      <ServizioDettaglio v={v} basePath="/catalogo" ctaHref={MAILTO} />
    </main>
  );
}
