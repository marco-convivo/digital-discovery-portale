import { getVetrinaPubblica } from "@/lib/catalogo/queries";
import { CatalogoVetrina } from "@/components/catalogo/vetrina";

export const metadata = {
  title: "Catalogo servizi · Digital Discovery",
  description: "La tua presenza digitale, gestita da noi.",
};

export default async function CatalogoPubblicoPage() {
  const servizi = await getVetrinaPubblica();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-[11px] bg-ink text-base font-extrabold text-on-ink">
          D
        </div>
        <div className="font-bold">Digital Discovery</div>
      </div>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-text">
          I nostri servizi
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-text-2">
          Tutto ciò che serve alla tua presenza digitale, con un unico referente
          e risultati misurabili. Esplora attività, condizioni e lavori realizzati.
        </p>
      </header>
      <CatalogoVetrina servizi={servizi} basePath="/catalogo" />
      <footer className="mt-12 text-center text-[12px] text-text-3">
        Digital Discovery S.r.l.
      </footer>
    </main>
  );
}
