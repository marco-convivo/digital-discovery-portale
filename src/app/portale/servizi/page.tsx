import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portale/client";
import { getPortaleHomeData } from "@/lib/portale/home";
import { ServiziAttivi } from "@/components/portale/servizi-attivi";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";

export default async function PortaleServizi() {
  const client = await getPortalClient();
  if (!client) redirect("/accedi");
  const { serviziAttivi } = await getPortaleHomeData(client.owner_id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
        I tuoi servizi
      </h1>
      <p className="mt-0.5 mb-6 text-sm text-text-2">
        Cosa hai attivato e di cosa ci occupiamo per te, con le prossime
        scadenze.
      </p>

      {serviziAttivi.length === 0 ? (
        <Card>
          <EmptyState
            title="Nessun servizio attivo"
            hint="I servizi dei tuoi contratti firmati compaiono qui."
          />
        </Card>
      ) : (
        <ServiziAttivi servizi={serviziAttivi} />
      )}
    </div>
  );
}
