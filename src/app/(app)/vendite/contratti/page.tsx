import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EntityList, type EntityRow } from "@/components/internal/entity-list";
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
  } | null;
  client: { id: string; ragione_sociale: string } | null;
}

export default async function ContrattiPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select(
      "id, stato, signed_at, signed_pdf_url, created_at, quote:quotes!contracts_quote_id_fkey(rate_num, tipo, ordine), client:clients!contracts_client_id_fkey(id, ragione_sociale)",
    )
    .order("created_at", { ascending: false });

  const rows: EntityRow[] = ((data ?? []) as unknown as Row[]).map((c) => {
    const servizi = serviziDaOrdine(c.quote?.ordine ?? null);
    const durata =
      c.quote?.tipo === "ricorrente"
        ? `${c.quote.rate_num ?? "—"} mesi`
        : c.quote
          ? (TIPO[c.quote.tipo] ?? c.quote.tipo)
          : null;
    const firmato = c.signed_at
      ? `Firmato il ${dataIt(c.signed_at)}`
      : `Creato ${dataIt(c.created_at)}`;
    return {
      id: c.id,
      title: c.client?.ragione_sociale ?? "—",
      subtitle: durata ? `${firmato} · ${durata}` : firmato,
      href: c.client ? `/vendite/clienti/${c.client.id}` : undefined,
      search: `${c.client?.ragione_sociale ?? ""} ${servizi.join(" ")}`,
      pill: { tone: TONE[c.stato] ?? "draft", label: c.stato },
      tags: servizi,
      action: c.signed_pdf_url
        ? { href: c.signed_pdf_url, label: "Apri contratto", external: true }
        : undefined,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Contratti
      </h1>
      <Card>
        <EntityList
          rows={rows}
          placeholder="Cerca per cliente o servizio…"
          empty="Nessun contratto."
        />
      </Card>
    </div>
  );
}
