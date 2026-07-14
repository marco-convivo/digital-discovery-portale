import "server-only";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppSettingsAdmin } from "@/lib/settings/app-settings";

// Il flusso pagamento pubblico gira in contesto anon: usiamo l'admin client
// (service role) MA sempre filtrato per public_token — il token è la capability.

export interface PaymentContext {
  clientSecret: string;
  publishableKey: string;
  quote: {
    numero: string | null;
    tipo: string;
    importo_totale: number | null;
    rata_mensile: number | null;
    rate_num: number | null;
  };
  ragioneSociale: string;
  statementDescriptor: string | null;
}

/** Carica il preventivo dal token, garantisce Customer + payment_setup, crea un SetupIntent. */
export async function ensurePaymentContext(
  token: string,
): Promise<PaymentContext | null> {
  const db = createAdminClient();

  const { data: quote } = await db
    .from("quotes")
    .select(
      "id, numero, tipo, importo_totale, rata_mensile, rate_num, client:clients!quotes_client_id_fkey(id, ragione_sociale, email)",
    )
    .eq("public_token", token)
    .maybeSingle();

  if (!quote || !quote.client) return null;
  const client = quote.client as unknown as {
    id: string;
    ragione_sociale: string;
    email: string | null;
  };

  // Contratto (firmato) di QUESTO preventivo: il piano va legato al contratto,
  // così un cliente con più contratti ha più piani indipendenti.
  const { data: contract } = await db
    .from("contracts")
    .select("id")
    .eq("quote_id", quote.id)
    .maybeSingle();
  const contractId = contract?.id ?? null;

  // payment_setup per (cliente, contratto)
  const psQuery = db
    .from("payment_setups")
    .select("id, stripe_customer_id")
    .eq("client_id", client.id);
  const { data: existing } = await (contractId
    ? psQuery.eq("contract_id", contractId)
    : psQuery.is("contract_id", null)
  ).maybeSingle();

  const stripe = getStripe();
  let setupId = existing?.id ?? null;
  let customerId = existing?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: client.ragione_sociale,
      email: client.email ?? undefined,
      metadata: {
        client_id: client.id,
        quote_id: quote.id,
        contract_id: contractId ?? "",
      },
    });
    customerId = customer.id;

    if (setupId) {
      await db
        .from("payment_setups")
        .update({ stripe_customer_id: customerId })
        .eq("id", setupId);
    } else {
      const { data: ins } = await db
        .from("payment_setups")
        .insert({
          client_id: client.id,
          contract_id: contractId,
          stripe_customer_id: customerId,
        })
        .select("id")
        .single();
      setupId = ins?.id ?? null;
    }
  }

  // SetupIntent: salva mandato SDD / carta. Il contract_id nei metadata serve
  // al webhook per legare subscription e rate al contratto giusto.
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",
    payment_method_types: ["sepa_debit", "card"],
    metadata: {
      quote_id: quote.id,
      client_id: client.id,
      contract_id: contractId ?? "",
      token,
    },
  });

  const settings = await getAppSettingsAdmin();

  return {
    clientSecret: setupIntent.client_secret!,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    quote: {
      numero: quote.numero,
      tipo: quote.tipo,
      importo_totale: quote.importo_totale,
      rata_mensile: quote.rata_mensile,
      rate_num: quote.rate_num,
    },
    ragioneSociale: client.ragione_sociale,
    statementDescriptor: settings.statement_descriptor,
  };
}
