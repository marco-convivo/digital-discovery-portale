import { createClient } from "@/lib/supabase/server";
import {
  MasterDetail,
  type ClienteConDoc,
  type DettaglioDoc,
} from "@/components/internal/master-detail";
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

export default async function PreventiviPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select(
      "id, numero, tipo, importo_totale, rata_mensile, rate_num, ordine, stato, public_token, created_at, client:clients!quotes_client_id_fkey(id, ragione_sociale)",
    )
    .order("created_at", { ascending: false });

  const byClient = new Map<string, ClienteConDoc>();
  for (const q of (data ?? []) as unknown as Row[]) {
    if (!q.client) continue;
    const ricorrente = q.tipo === "ricorrente";
    const doc: DettaglioDoc = {
      id: q.id,
      titolo: `${q.numero ?? "—"} · ${dataIt(q.created_at)}`,
      stato: { tone: TONE[q.stato] ?? "draft", label: q.stato },
      servizi: serviziDaOrdine(q.ordine).map((label) => ({ label })),
      totale: q.importo_totale,
      rata: ricorrente ? q.rata_mensile : null,
      durata: ricorrente ? `${q.rate_num ?? "—"} mesi` : (TIPO[q.tipo] ?? q.tipo),
      action: {
        href: `/preventivo/${q.public_token}`,
        label: "Link cliente",
        icon: "link",
        external: true,
      },
    };
    const c = byClient.get(q.client.id);
    if (c) c.documenti.push(doc);
    else
      byClient.set(q.client.id, {
        id: q.client.id,
        ragione_sociale: q.client.ragione_sociale,
        documenti: [doc],
      });
  }
  const clienti = [...byClient.values()].sort((a, b) =>
    a.ragione_sociale.localeCompare(b.ragione_sociale),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Preventivi
      </h1>
      <MasterDetail
        clienti={clienti}
        detailLabel="preventivi"
        initialSelected={cliente ?? null}
      />
    </div>
  );
}
