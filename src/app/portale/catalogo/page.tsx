import { getVetrinaPubblica } from "@/lib/catalogo/queries";
import { CatalogoVetrina } from "@/components/catalogo/vetrina";

export default async function PortaleCatalogoPage() {
  const servizi = await getVetrinaPubblica();
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Catalogo servizi
        </h1>
        <p className="mt-0.5 text-sm text-text-2">
          Esplora i nostri servizi, le condizioni e i lavori realizzati.
        </p>
      </header>
      <CatalogoVetrina servizi={servizi} basePath="/portale/catalogo" />
    </div>
  );
}
