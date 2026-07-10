import "server-only";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // payment_setup "aperto" per il cliente (contract_id null finché non c'è DocuSeal)
  const { data: existing } = await db
    .from("payment_setups")
    .select("id, stripe_customer_id")
    .eq("client_id", client.id)
    .is("contract_id", null)
    .maybeSingle();

  const stripe = getStripe();
  let setupId = existing?.id ?? null;
  let customerId = existing?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: client.ragione_sociale,
      email: client.email ?? undefined,
      metadata: { client_id: client.id, quote_id: quote.id },
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
        .insert({ client_id: client.id, stripe_customer_id: customerId })
        .select("id")
        .single();
      setupId = ins?.id ?? null;
    }
  }

  // SetupIntent: salva mandato SDD / carta per l'addebito (subscription in Fase 2b).
  // Solo i due metodi del prodotto (mockup): addebito SDD + carta.
  // Con SEPA non ancora attiva la carta funziona già; l'SDD si completa appena
  // la capability sepa_debit_payments è attiva sull'account.
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",
    payment_method_types: ["sepa_debit", "card"],
    metadata: { quote_id: quote.id, client_id: client.id, token },
  });

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
  };
}
