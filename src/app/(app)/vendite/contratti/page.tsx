import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EntityList, type EntityRow } from "@/components/internal/entity-list";
import type { Tone } from "@/components/ui/status-pill";
import { dataIt } from "@/lib/format";

const TONE: Record<string, Tone> = {
  inviato: "info",
  firmato: "paid",
  annullato: "fail",
};

interface Row {
  id: string;
  stato: string;
  signed_at: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  client: { id: string; ragione_sociale: string } | null;
}

export default async function ContrattiPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select(
      "id, stato, signed_at, signed_pdf_url, created_at, client:clients!contracts_client_id_fkey(id, ragione_sociale)",
    )
    .order("created_at", { ascending: false });

  const rows: EntityRow[] = ((data ?? []) as unknown as Row[]).map((c) => ({
    id: c.id,
    title: c.client?.ragione_sociale ?? "—",
    subtitle: c.signed_at
      ? `Firmato il ${dataIt(c.signed_at)}`
      : `Creato ${dataIt(c.created_at)}`,
    href: c.client ? `/vendite/clienti/${c.client.id}` : undefined,
    search: c.client?.ragione_sociale ?? "",
    pill: { tone: TONE[c.stato] ?? "draft", label: c.stato },
    action: c.signed_pdf_url
      ? { href: c.signed_pdf_url, label: "Apri contratto", external: true }
      : undefined,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Contratti
      </h1>
      <Card>
        <EntityList
          rows={rows}
          placeholder="Cerca per cliente…"
          empty="Nessun contratto."
        />
      </Card>
    </div>
  );
}
