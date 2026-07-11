import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { DocumentiList, type DocRow } from "@/components/internal/documenti-list";
import type { Tone } from "@/components/ui/status-pill";
import { serviziDaOrdine, type OrdineSelezione } from "@/lib/catalog";
import { dataIt } from "@/lib/format";

const TONE: Record<string, Tone> = {
  bozza: "draft",
  inviato: "info",
  visto: "wait",
  accettato: "paid",
  rifiutato: "fail",
  scaduto: "fail",
};
const TIPO: Record<string, string> = {
  ricorrente: "ricorrente",
  una_tantum: "una tantum",
  acconto: "acconto",
};

interface Row {
  id: string;
  numero: string | null;
  tipo: string;
  importo_totale: number | null;
  rata_mensile: number | null;
  rate_num: number | null;
  ordine: OrdineSelezione | null;
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
      "id, numero, tipo, importo_totale, rata_mensile, rate_num, ordine, stato, public_token, created_at, client:clients!quotes_client_id_fkey(id, ragione_sociale)",
    )
    .order("created_at", { ascending: false });

  const rows: DocRow[] = ((data ?? []) as unknown as Row[]).map((q) => {
    const ricorrente = q.tipo === "ricorrente";
    const servizi = serviziDaOrdine(q.ordine);
    return {
      id: q.id,
      clientName: q.client?.ragione_sociale ?? "—",
      clientHref: q.client ? `/vendite/clienti/${q.client.id}` : undefined,
      meta: `${q.numero ?? "—"} · ${dataIt(q.created_at)}`,
      servizi: servizi.map((label) => ({ label })),
      totale: q.importo_totale,
      rata: ricorrente ? q.rata_mensile : null,
      durata: ricorrente ? `${q.rate_num ?? "—"} mesi` : (TIPO[q.tipo] ?? q.tipo),
      stato: { tone: TONE[q.stato] ?? "draft", label: q.stato },
      action: {
        href: `/preventivo/${q.public_token}`,
        label: "Apri link",
        external: true,
      },
      search: `${q.client?.ragione_sociale ?? ""} ${q.numero ?? ""} ${servizi.join(" ")}`,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Preventivi
      </h1>
      <Card>
        <DocumentiList
          rows={rows}
          placeholder="Cerca per cliente, numero o servizio…"
          empty="Nessun preventivo."
        />
      </Card>
    </div>
  );
}
