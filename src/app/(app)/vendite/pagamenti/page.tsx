import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EntityList, type EntityRow } from "@/components/internal/entity-list";
import { PAYMENT_STATO_META } from "@/lib/stati";
import { euro, dataIt } from "@/lib/format";
import type { Database } from "@/lib/database.types";

type PaymentStato = Database["public"]["Enums"]["payment_stato"];

interface Row {
  id: string;
  numero_rata: number | null;
  importo: number | null;
  scadenza: string | null;
  stato: PaymentStato;
  client: { id: string; ragione_sociale: string } | null;
}

export default async function PagamentiPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select(
      "id, numero_rata, importo, scadenza, stato, client:clients!payments_client_id_fkey(id, ragione_sociale)",
    )
    .order("scadenza", { ascending: true });

  const rows: EntityRow[] = ((data ?? []) as unknown as Row[]).map((p) => {
    const meta = PAYMENT_STATO_META[p.stato];
    return {
      id: p.id,
      title: p.client?.ragione_sociale ?? "—",
      subtitle: `Rata ${p.numero_rata ?? "—"} · ${euro(p.importo)} · scad. ${dataIt(p.scadenza)}`,
      href: p.client ? `/vendite/clienti/${p.client.id}` : undefined,
      search: p.client?.ragione_sociale ?? "",
      pill: { tone: meta.tone, label: meta.label },
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Pagamenti
      </h1>
      <Card>
        <EntityList
          rows={rows}
          placeholder="Cerca per cliente…"
          empty="Nessuna rata."
        />
      </Card>
    </div>
  );
}
