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
  inviato: "info",
  firmato: "paid",
  annullato: "fail",
};
const TIPO: Record<string, string> = {
  ricorrente: "ricorrente",
  una_tantum: "una tantum",
  acconto: "acconto",
};

interface Row {
  id: string;
  stato: string;
  signed_at: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  quote: {
    rate_num: number | null;
    tipo: string;
    ordine: OrdineSelezione | null;
    importo_totale: number | null;
    rata_mensile: number | null;
  } | null;
  client: { id: string; ragione_sociale: string } | null;
}

export default async function ContrattiPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select(
      "id, stato, signed_at, signed_pdf_url, created_at, quote:quotes!contracts_quote_id_fkey(rate_num, tipo, ordine, importo_totale, rata_mensile), client:clients!contracts_client_id_fkey(id, ragione_sociale)",
    )
    .order("created_at", { ascending: false });

  const byClient = new Map<string, ClienteConDoc>();
  for (const c of (data ?? []) as unknown as Row[]) {
    if (!c.client) continue;
    const q = c.quote;
    const ricorrente = q?.tipo === "ricorrente";
    const doc: DettaglioDoc = {
      id: c.id,
      titolo: c.signed_at
        ? `Firmato il ${dataIt(c.signed_at)}`
        : `Creato ${dataIt(c.created_at)}`,
      stato: { tone: TONE[c.stato] ?? "draft", label: c.stato },
      servizi: serviziDaOrdine(q?.ordine ?? null).map((label) => ({ label })),
      totale: q?.importo_totale ?? null,
      rata: ricorrente ? (q?.rata_mensile ?? null) : null,
      durata: ricorrente
        ? `${q?.rate_num ?? "—"} mesi`
        : q
          ? (TIPO[q.tipo] ?? q.tipo)
          : null,
      action: c.signed_pdf_url
        ? { href: c.signed_pdf_url, label: "Apri contratto", external: true }
        : undefined,
    };
    const cc = byClient.get(c.client.id);
    if (cc) cc.documenti.push(doc);
    else
      byClient.set(c.client.id, {
        id: c.client.id,
        ragione_sociale: c.client.ragione_sociale,
        documenti: [doc],
      });
  }
  const clienti = [...byClient.values()].sort((a, b) =>
    a.ragione_sociale.localeCompare(b.ragione_sociale),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Contratti
      </h1>
      <MasterDetail
        clienti={clienti}
        detailLabel="contratti"
        initialSelected={cliente ?? null}
      />
    </div>
  );
}
