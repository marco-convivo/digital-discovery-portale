import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portale/client";
import { getPortaleHomeData } from "@/lib/portale/home";
import { Card } from "@/components/ui/card";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { dataIt } from "@/lib/format";
import type { ServizioAttivo } from "@/lib/portale/home";

function stato(s: ServizioAttivo): { tone: Tone; label: string } {
  if (s.unaTantum || s.giorni == null) return { tone: "paid", label: "attivo" };
  if (s.giorni < 0) return { tone: "fail", label: "scaduto" };
  if (s.giorni <= 30) return { tone: "wait", label: `scade tra ${s.giorni} gg` };
  return { tone: "paid", label: "attivo" };
}

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
        Tutto ciò che gestiamo per te, con le prossime scadenze.
      </p>

      <Card>
        {serviziAttivi.length === 0 ? (
          <EmptyState
            title="Nessun servizio attivo"
            hint="I servizi dei tuoi contratti firmati compaiono qui."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {serviziAttivi.map((s, i) => {
              const st = stato(s);
              return (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-text">
                      {s.label}
                    </div>
                    <div className="text-[12.5px] text-text-3">
                      {s.unaTantum
                        ? "Una tantum"
                        : s.scadenzaIso
                          ? `Rinnovo il ${dataIt(s.scadenzaIso)}`
                          : "Attivo"}
                    </div>
                  </div>
                  <StatusPill tone={st.tone}>{st.label}</StatusPill>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
