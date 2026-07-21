import { notFound } from "next/navigation";
import { getClienteScheda } from "@/lib/clienti/scheda";
import { ClienteScheda } from "@/components/internal/cliente-scheda";
import { Drawer } from "@/components/internal/drawer";

// Intercetta la navigazione soft verso /vendite/clienti/[id] e la mostra nel
// pannello a destra. Il caricamento diretto dell'URL usa la pagina intera.
export default async function ClienteDrawer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getClienteScheda(id);
  if (!data) notFound();

  return (
    <Drawer title="Scheda cliente">
      <ClienteScheda data={data} layout="drawer" />
    </Drawer>
  );
}
