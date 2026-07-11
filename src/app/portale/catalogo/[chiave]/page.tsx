import { notFound } from "next/navigation";
import { getServizioPubblico } from "@/lib/catalogo/queries";
import { ServizioDettaglio } from "@/components/catalogo/servizio-dettaglio";

export default async function PortaleServizioPage({
  params,
}: {
  params: Promise<{ chiave: string }>;
}) {
  const { chiave } = await params;
  const v = await getServizioPubblico(chiave);
  if (!v) notFound();
  return (
    <ServizioDettaglio
      v={v}
      basePath="/portale/catalogo"
      ctaHref="mailto:info@digitaldiscovery.it?subject=Richiesta%20preventivo"
    />
  );
}
