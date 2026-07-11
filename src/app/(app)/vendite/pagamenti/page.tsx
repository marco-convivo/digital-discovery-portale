import { createClient } from "@/lib/supabase/server";
import {
  MasterDetailPagamenti,
  type ClientePagamenti,
} from "@/components/internal/master-detail-pagamenti";
import { type RataRow } from "@/components/internal/piano-pagamenti";
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

export default async function PagamentiPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const supabase = await createClient();
  const [{ data: payData }, { data: contrData }] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "numero_rata, importo, scadenza, stato, contract_id, client:clients!payments_client_id_fkey(id, ragione_sociale)",
      )
      .order("numero_rata", { ascending: true }),
    supabase.from("contracts").select("id, signed_at"),
  ]);

  const firmato = new Map(
    ((contrData ?? []) as { id: string; signed_at: string | null }[]).map((c) => [
      c.id,
      c.signed_at,
    ]),
  );

  const byClient = new Map<string, ClientePagamenti>();
  for (const p of (payData ?? []) as unknown as Row[]) {
    if (!p.client) continue;
    let cliente = byClient.get(p.client.id);
    if (!cliente) {
      cliente = {
        id: p.client.id,
        ragione_sociale: p.client.ragione_sociale,
        piani: [],
      };
      byClient.set(p.client.id, cliente);
    }
    const key = p.contract_id ?? "__none__";
    let piano = cliente.piani.find((pl) => pl.key === key);
    if (!piano) {
      const signedAt = p.contract_id ? firmato.get(p.contract_id) : null;
      piano = {
        key,
        label: signedAt ? `Contratto firmato il ${dataIt(signedAt)}` : "Piano",
        rate: [],
      };
      cliente.piani.push(piano);
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
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-2xl font-extrabold tracking-[-0.02em] text-text">
        Pagamenti
      </h1>
      <MasterDetailPagamenti clienti={clienti} initialSelected={cliente ?? null} />
    </div>
  );
}
