import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getPrezziBase } from "@/lib/catalogo/queries";
import { dataIt } from "@/lib/format";
import type { PreventivoItem } from "@/components/internal/preventivi-list";
import type { FatturaRow } from "@/components/internal/fatture-cliente";
import type { RataRow } from "@/components/internal/piano-pagamenti";
import type { PianoGruppo } from "@/components/internal/piani-pagamento";
import type { OrdineSelezione } from "@/lib/catalog";
import type { Client } from "@/lib/types";

export interface ContractRow {
  id: string;
  stato: string;
  signed_at: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  quote: { ordine: OrdineSelezione | null } | null;
}

export interface ClienteSchedaData {
  client: Client;
  prezziBase: Awaited<ReturnType<typeof getPrezziBase>>;
  quotes: PreventivoItem[];
  contratti: ContractRow[];
  fatture: FatturaRow[];
  gruppiPagamenti: PianoGruppo[];
}

/** Dati completi della scheda cliente, condivisi tra pagina intera e pannello. */
export async function getClienteScheda(
  id: string,
): Promise<ClienteSchedaData | null> {
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!client) return null;
  const c = client as Client;

  const prezziBase = await getPrezziBase();

  const [
    { data: quotesData },
    { data: payData },
    { data: contrData },
    { data: invData },
  ] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, numero, stato, importo_totale, public_token, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, numero_rata, importo, scadenza, stato, contract_id, subscription_id")
      .eq("client_id", id)
      .order("numero_rata", { ascending: true }),
    supabase
      .from("contracts")
      .select(
        "id, stato, signed_at, signed_pdf_url, created_at, quote:quotes!contracts_quote_id_fkey(ordine)",
      )
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, numero, data, importo, pdf_url")
      .eq("client_id", id)
      .order("data", { ascending: false }),
  ]);

  const quotes = (quotesData ?? []) as unknown as PreventivoItem[];
  const contratti = (contrData ?? []) as unknown as ContractRow[];
  const fatture = (invData ?? []) as unknown as FatturaRow[];

  const pays = (payData ?? []) as unknown as (RataRow & {
    contract_id: string | null;
    subscription_id: string | null;
  })[];
  const NONE = "__none__";
  const gruppiPagamenti: PianoGruppo[] = Array.from(
    pays.reduce((map, p) => {
      const k = p.contract_id ?? NONE;
      const g = map.get(k) ?? { rate: [] as RataRow[], manuale: true };
      g.rate.push({
        id: p.id,
        numero_rata: p.numero_rata,
        importo: p.importo,
        scadenza: p.scadenza,
        stato: p.stato,
      });
      if (p.subscription_id) g.manuale = false;
      map.set(k, g);
      return map;
    }, new Map<string, { rate: RataRow[]; manuale: boolean }>()),
  ).map(([k, g]) => {
    const contract = k === NONE ? null : (contratti.find((c) => c.id === k) ?? null);
    const label = contract
      ? contract.signed_at
        ? `Contratto · firmato il ${dataIt(contract.signed_at)}`
        : "Contratto"
      : "Piano";
    return { key: k, label, rate: g.rate, manuale: g.manuale };
  });

  return { client: c, prezziBase, quotes, contratti, fatture, gruppiPagamenti };
}
