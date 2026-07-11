import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { scadenzeServizi, giorniAllaScadenza } from "@/lib/servizi";
import { dataIt } from "@/lib/format";
import type { OrdineSelezione } from "@/lib/catalog";

interface Row {
  signed_at: string | null;
  quote: { ordine: OrdineSelezione | null } | null;
  client: { id: string; ragione_sociale: string } | null;
}

interface Item {
  clienteId: string;
  cliente: string;
  servizio: string;
  scadenzaIso: string;
  giorni: number;
}

function urgenza(g: number): { tone: Tone; label: string } {
  if (g < 0) return { tone: "fail", label: `scaduto da ${-g} gg` };
  if (g === 0) return { tone: "fail", label: "scade oggi" };
  if (g <= 30) return { tone: "wait", label: `tra ${g} gg` };
  return { tone: "info", label: `tra ${g} gg` };
}

export default async function ScadenzePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select(
      "signed_at, quote:quotes!contracts_quote_id_fkey(ordine), client:clients!contracts_client_id_fkey(id, ragione_sociale)",
    )
    .eq("stato", "firmato");

  const items: Item[] = [];
  for (const c of (data ?? []) as unknown as Row[]) {
    if (!c.client || !c.signed_at) continue;
    for (const s of scadenzeServizi(c.quote?.ordine ?? null, c.signed_at)) {
      if (s.unaTantum || !s.scadenzaIso) continue;
      items.push({
        clienteId: c.client.id,
        cliente: c.client.ragione_sociale,
        servizio: s.label,
        scadenzaIso: s.scadenzaIso,
        giorni: giorniAllaScadenza(s.scadenzaIso),
      });
    }
  }
  items.sort((a, b) => a.giorni - b.giorni);
  const urgenti = items.filter((i) => i.giorni <= 60).length;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
          Servizi in scadenza
        </h1>
        <p className="mt-0.5 text-sm text-text-2">
          Scadenze dei servizi ricorrenti, dalla firma del contratto. Ordinate
          per urgenza — {urgenti} entro 60 giorni.
        </p>
      </header>

      <Card>
        {items.length === 0 ? (
          <EmptyState
            title="Nessun servizio con scadenza"
            hint="I servizi ricorrenti dei contratti firmati compaiono qui, ordinati per scadenza."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {items.map((it, i) => {
              const u = urgenza(it.giorni);
              return (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/vendite/clienti/${it.clienteId}`}
                      className="font-bold text-text hover:text-violet"
                    >
                      {it.cliente}
                    </Link>
                    <div className="mt-0.5 truncate text-[12.5px] text-text-3">
                      {it.servizio} · scade il {dataIt(it.scadenzaIso)}
                    </div>
                  </div>
                  <StatusPill tone={u.tone}>{u.label}</StatusPill>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
