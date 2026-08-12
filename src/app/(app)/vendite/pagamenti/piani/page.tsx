import { createClient } from "@/lib/supabase/server";
import { countInsolutiAperti } from "@/lib/insoluti/queries";
import { CassaShell } from "@/components/internal/cassa-shell";
import {
  MasterDetailPagamenti,
  type ClientePagamenti,
} from "@/components/internal/master-detail-pagamenti";
import { type RataRow } from "@/components/internal/piano-pagamenti";
import { type FatturaRow } from "@/components/internal/fatture-cliente";
import { dataIt } from "@/lib/format";
import type { Database } from "@/lib/database.types";

type PaymentStato = Database["public"]["Enums"]["payment_stato"];

interface Row {
  numero_rata: number | null;
  importo: number | null;
  scadenza: string | null;
  stato: PaymentStato;
  contract_id: string | null;
  client: { id: string; ragione_sociale: string } | null;
}

interface InvoiceRow extends FatturaRow {
  client_id: string;
}

export default async function CassaPianiPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const [{ data: payData }, { data: contrData }, { data: invData }, insolutiCount] =
    await Promise.all([
      supabase
        .from("payments")
        .select(
          "numero_rata, importo, scadenza, stato, contract_id, client:clients!payments_client_id_fkey(id, ragione_sociale)",
        )
        .order("numero_rata", { ascending: true }),
      supabase.from("contracts").select("id, signed_at"),
      supabase
        .from("invoices")
        .select("id, numero, data, importo, pdf_url, client_id")
        .order("data", { ascending: false }),
      countInsolutiAperti(),
    ]);

  const firmato = new Map(
    ((contrData ?? []) as { id: string; signed_at: string | null }[]).map((c) => [
      c.id,
      c.signed_at,
    ]),
  );

  const fattureByClient = new Map<string, FatturaRow[]>();
  for (const inv of (invData ?? []) as unknown as InvoiceRow[]) {
    const arr = fattureByClient.get(inv.client_id) ?? [];
    arr.push({
      id: inv.id,
      numero: inv.numero,
      data: inv.data,
      importo: inv.importo,
      pdf_url: inv.pdf_url,
    });
    fattureByClient.set(inv.client_id, arr);
  }

  const byClient = new Map<string, ClientePagamenti>();
  for (const p of (payData ?? []) as unknown as Row[]) {
    if (!p.client) continue;
    let cli = byClient.get(p.client.id);
    if (!cli) {
      cli = {
        id: p.client.id,
        ragione_sociale: p.client.ragione_sociale,
        piani: [],
        fatture: fattureByClient.get(p.client.id) ?? [],
      };
      byClient.set(p.client.id, cli);
    }
    const key = p.contract_id ?? "__none__";
    let piano = cli.piani.find((pl) => pl.key === key);
    if (!piano) {
      const signedAt = p.contract_id ? firmato.get(p.contract_id) : null;
      piano = {
        key,
        label: signedAt ? `Contratto firmato il ${dataIt(signedAt)}` : "Piano",
        rate: [],
      };
      cli.piani.push(piano);
    }
    (piano.rate as RataRow[]).push({
      numero_rata: p.numero_rata,
      importo: p.importo,
      scadenza: p.scadenza,
      stato: p.stato,
    });
  }
  const clienti = [...byClient.values()].sort((a, b) =>
    a.ragione_sociale.localeCompare(b.ragione_sociale),
  );

  return (
    <CassaShell active="piani" insolutiCount={insolutiCount}>
      <MasterDetailPagamenti clienti={clienti} initialSelected={cliente ?? null} />
    </CassaShell>
  );
}
