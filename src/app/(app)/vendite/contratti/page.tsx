import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { DocumentiList, type DocRow } from "@/components/internal/documenti-list";
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

export default async function ContrattiPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select(
      "id, stato, signed_at, signed_pdf_url, created_at, quote:quotes!contracts_quote_id_fkey(rate_num, tipo, ordine, importo_totale, rata_mensile), client:clients!contracts_client_id_fkey(id, ragione_sociale)",
    )
    .order("created_at", { ascending: false });

  const rows: DocRow[] = ((data ?? []) as unknown as Row[]).map((c) => {
    const q = c.quote;
    const ricorrente = q?.tipo === "ricorrente";
    const servizi = serviziDaOrdine(q?.ordine ?? null);
    return {
      id: c.id,
      clientName: c.client?.ragione_sociale ?? "—",
      clientHref: c.client ? `/vendite/clienti/${c.client.id}` : undefined,
      meta: c.signed_at
        ? `Firmato il ${dataIt(c.signed_at)}`
        : `Creato ${dataIt(c.created_at)}`,
      servizi: servizi.map((label) => ({ label })),
      totale: q?.importo_totale ?? null,
      rata: ricorrente ? (q?.rata_mensile ?? null) : null,
      durata: ricorrente
        ? `${q?.rate_num ?? "—"} mesi`
        : q
          ? (TIPO[q.tipo] ?? q.tipo)
          : null,
      stato: { tone: TONE[c.stato] ?? "draft", label: c.stato },
      action: c.signed_pdf_url
        ? { href: c.signed_pdf_url, label: "Apri contratto", external: true }
        : undefined,
      search: `${c.client?.ragione_sociale ?? ""} ${servizi.join(" ")}`,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Contratti
      </h1>
      <Card>
        <DocumentiList
          rows={rows}
          placeholder="Cerca per cliente o servizio…"
          empty="Nessun contratto."
        />
      </Card>
    </div>
  );
}
