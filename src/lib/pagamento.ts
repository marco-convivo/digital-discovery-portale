import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PagamentoInfo {
  quoteId: string;
  numero: string | null;
  tipo: string;
  importo_totale: number | null;
  rata_mensile: number | null;
  rate_num: number | null;
  clientId: string;
  ragioneSociale: string;
  email: string | null;
  indirizzo: string | null;
  contractId: string | null;
  giaImpostato: boolean; // pagamento già configurato (carta o mandato SEPA)
}

/**
 * Info del preventivo per le pagine di pagamento (scelta metodo / mandato SEPA),
 * SENZA creare nulla su Stripe. Gira in contesto anon: admin client filtrato
 * per public_token (il token è la capability).
 */
export async function getPagamentoInfo(
  token: string,
): Promise<PagamentoInfo | null> {
  const db = createAdminClient();

  const { data: quote } = await db
    .from("quotes")
    .select(
      "id, numero, tipo, importo_totale, rata_mensile, rate_num, client:clients!quotes_client_id_fkey(id, ragione_sociale, email, indirizzo)",
    )
    .eq("public_token", token)
    .maybeSingle();
  if (!quote || !quote.client) return null;
  const client = quote.client as unknown as {
    id: string;
    ragione_sociale: string;
    email: string | null;
    indirizzo: string | null;
  };

  const { data: contract } = await db
    .from("contracts")
    .select("id")
    .eq("quote_id", quote.id)
    .maybeSingle();
  const contractId = contract?.id ?? null;

  // Già impostato? mandato SEPA registrato, oppure subscription Stripe attiva.
  const { count: mandati } = await db
    .from("sepa_mandates")
    .select("id", { count: "exact", head: true })
    .eq("quote_id", quote.id);

  const psQuery = db
    .from("payment_setups")
    .select("stripe_subscription_id, stato, metodo")
    .eq("client_id", client.id);
  const { data: ps } = await (contractId
    ? psQuery.eq("contract_id", contractId)
    : psQuery.is("contract_id", null)
  ).maybeSingle();
  const cartaAttiva =
    !!ps?.stripe_subscription_id && ps.stato !== "annullato";
  // Bonifico già scelto: metodo bonifico + non annullato.
  const bonificoScelto = ps?.metodo === "bonifico" && ps.stato !== "annullato";

  return {
    quoteId: quote.id,
    numero: quote.numero,
    tipo: quote.tipo,
    importo_totale: quote.importo_totale,
    rata_mensile: quote.rata_mensile,
    rate_num: quote.rate_num,
    clientId: client.id,
    ragioneSociale: client.ragione_sociale,
    email: client.email,
    indirizzo: client.indirizzo,
    contractId,
    giaImpostato: (mandati ?? 0) > 0 || cartaAttiva || bonificoScelto,
  };
}
