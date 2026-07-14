import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portale/client";
import { getUltimiLavori } from "@/lib/catalogo/queries";
import { UltimiLavori } from "@/components/portale/ultimi-lavori";

export default async function LavoriPage() {
  const client = await getPortalClient();
  if (!client) redirect("/accedi");

  const lavori = await getUltimiLavori(24);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Ultimi lavori
        </h1>
        <p className="mt-1 max-w-[60ch] text-[15px] text-text-2">
          Una selezione di progetti realizzati per i nostri clienti — per idee e
          ispirazione sulla tua presenza digitale.
        </p>
      </header>

      {lavori.length > 0 ? (
        <UltimiLavori lavori={lavori} columns={3} />
      ) : (
        <div className="rounded-card border border-line/60 bg-card p-8 text-center">
          <p className="font-bold text-text">Presto qui i nostri lavori ✨</p>
          <p className="mt-1 text-sm text-text-2">
            Stiamo raccogliendo i progetti migliori da mostrarti.
          </p>
        </div>
      )}
    </div>
  );
}
