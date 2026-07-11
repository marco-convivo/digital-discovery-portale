import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EntityList, type EntityRow } from "@/components/internal/entity-list";
import type { Tone } from "@/components/ui/status-pill";
import { euro, dataIt } from "@/lib/format";

const TONE: Record<string, Tone> = {
  bozza: "draft",
  inviato: "info",
  visto: "wait",
  accettato: "paid",
  rifiutato: "fail",
  scaduto: "fail",
};

interface Row {
  id: string;
  numero: string | null;
  importo_totale: number | null;
  stato: string;
  public_token: string;
  created_at: string;
  client: { id: string; ragione_sociale: string } | null;
}

export default async function PreventiviPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select(
      "id, numero, importo_totale, stato, public_token, created_at, client:clients!quotes_client_id_fkey(id, ragione_sociale)",
    )
    .order("created_at", { ascending: false });

  const rows: EntityRow[] = ((data ?? []) as unknown as Row[]).map((q) => ({
    id: q.id,
    title: q.client?.ragione_sociale ?? "—",
    subtitle: `${q.numero ?? "—"} · ${dataIt(q.created_at)} · ${euro(q.importo_totale)}`,
    href: q.client ? `/vendite/clienti/${q.client.id}` : undefined,
    search: `${q.client?.ragione_sociale ?? ""} ${q.numero ?? ""}`,
    pill: { tone: TONE[q.stato] ?? "draft", label: q.stato },
    action: { href: `/preventivo/${q.public_token}`, label: "Apri link", external: true },
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Preventivi
      </h1>
      <Card>
        <EntityList
          rows={rows}
          placeholder="Cerca per cliente o numero…"
          empty="Nessun preventivo."
        />
      </Card>
    </div>
  );
}
