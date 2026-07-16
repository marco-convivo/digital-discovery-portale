import "server-only";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppSettingsAdmin } from "@/lib/settings/app-settings";
import { ALIQUOTA_IVA } from "@/lib/format";

// Il flusso pagamento pubblico gira in contesto anon: usiamo l'admin client
// (service role) MA sempre filtrato per public_token — il token è la capability.

export interface PaymentContext {
  // client_secret della PaymentIntent del PRIMO addebito (subscription o una
  // tantum): il cliente la conferma ON-SESSION nel browser, così l'eventuale
  // 3D Secure avviene mentre è presente (off-session fallirebbe). null se il
  // pagamento è già stato completato (ricarichi della pagina dopo il pagamento).
  clientSecret: string | null;
  giaPagato: boolean;
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

function lordo(netto: number): number {
  return Math.round(netto * (1 + ALIQUOTA_IVA) * 100); // centesimi, IVA inclusa
}

function scadenzaMese(base: Date, mesiAvanti: number): string {
  const d = new Date(base);
  d.setMonth(d.getMonth() + mesiAvanti);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// client_secret con cui confermare l'invoice della subscription lato browser.
// Nella API attuale sta in invoice.confirmation_secret; lo recuperiamo via
// expand, con retrieve dedicato dell'invoice come fallback.
async function confirmationSecret(
  stripe: Stripe,
  invoice: string | Stripe.Invoice | null | undefined,
): Promise<string | null> {
  if (!invoice) return null;
  if (typeof invoice !== "string") {
    const cs = (invoice as unknown as {
      confirmation_secret?: { client_secret?: string } | null;
    }).confirmation_secret?.client_secret;
    if (cs) return cs;
  }
  const invId = typeof invoice === "string" ? invoice : invoice.id;
  if (!invId) return null;
  try {
    const full = (await stripe.invoices.retrieve(invId, {
      expand: ["confirmation_secret"],
    })) as unknown as { confirmation_secret?: { client_secret?: string } | null };
    return full.confirmation_secret?.client_secret ?? null;
  } catch {
    return null;
  }
}

function invoiceIsPaid(
  invoice: string | Stripe.Invoice | null | undefined,
): boolean {
  if (!invoice || typeof invoice === "string") return false;
  const inv = invoice as unknown as { status?: string; paid?: boolean };
  return inv.status === "paid" || inv.paid === true;
}

/**
 * Carica il preventivo dal token, garantisce Customer + payment_setup e prepara
 * il PRIMO addebito da confermare on-session:
 *  - ricorrente → subscription `default_incomplete` (nessun addebito automatico:
 *    la prima fattura si conferma nel browser) + pre-genera le rate;
 *  - una tantum → PaymentIntent da confermare nel browser.
 * Idempotente: a ogni ricarica riusa subscription/PaymentIntent esistenti, così
 * il refresh non crea doppioni.
 */
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
    .select("id, stripe_customer_id, stripe_subscription_id, stato")
    .eq("client_id", client.id);
  const { data: existing } = await (contractId
    ? psQuery.eq("contract_id", contractId)
    : psQuery.is("contract_id", null)
  ).maybeSingle();

  const stripe = getStripe();
  const settings = await getAppSettingsAdmin();
  let setupId = existing?.id ?? null;
  let customerId = existing?.stripe_customer_id ?? null;
  let subscriptionId = existing?.stripe_subscription_id ?? null;

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

  const metadata = {
    quote_id: quote.id,
    client_id: client.id,
    contract_id: contractId ?? "",
    token,
  };

  const baseCtx = {
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

  // ---- UNA TANTUM: PaymentIntent singola, confermata on-session ----
  if (quote.tipo !== "ricorrente") {
    const importo = Number(quote.importo_totale ?? 0);

    // Riusa la PaymentIntent già creata per questa rata (idempotenza al refresh).
    const { data: rataEsistente } = await db
      .from("payments")
      .select("id, stripe_payment_intent_id")
      .eq("client_id", client.id)
      .eq("numero_rata", 1)
      .is("subscription_id", null)
      .not("stripe_payment_intent_id", "is", null)
      .maybeSingle();

    if (rataEsistente?.stripe_payment_intent_id) {
      const pi = await stripe.paymentIntents.retrieve(
        rataEsistente.stripe_payment_intent_id,
      );
      if (pi.status === "succeeded" || pi.status === "processing") {
        return { ...baseCtx, clientSecret: null, giaPagato: true };
      }
      if (pi.status !== "canceled") {
        return { ...baseCtx, clientSecret: pi.client_secret, giaPagato: false };
      }
      // PaymentIntent annullata → ne creiamo una nuova qui sotto.
    }

    const pi = await stripe.paymentIntents.create({
      customer: customerId,
      amount: lordo(importo), // LORDO (IVA inclusa)
      currency: "eur",
      payment_method_types: ["card", "sepa_debit"],
      metadata: { ...metadata, tipo: "iniziale" },
    });

    if (rataEsistente?.id) {
      await db
        .from("payments")
        .update({ stripe_payment_intent_id: pi.id, stato: "pending" })
        .eq("id", rataEsistente.id);
    } else {
      await db.from("payments").insert({
        client_id: client.id,
        contract_id: contractId,
        numero_rata: 1,
        importo,
        scadenza: scadenzaMese(new Date(), 0),
        stato: "pending",
        stripe_payment_intent_id: pi.id,
      });
    }

    return { ...baseCtx, clientSecret: pi.client_secret, giaPagato: false };
  }

  // ---- RICORRENTE: subscription default_incomplete, prima fattura on-session ----
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice.confirmation_secret"],
    });
    const latest = sub.latest_invoice;
    if (
      sub.status === "active" ||
      sub.status === "trialing" ||
      invoiceIsPaid(latest)
    ) {
      return { ...baseCtx, clientSecret: null, giaPagato: true };
    }
    if (sub.status === "incomplete") {
      const cs = await confirmationSecret(stripe, latest);
      if (cs) return { ...baseCtx, clientSecret: cs, giaPagato: false };
    }
    // incomplete_expired / canceled (o secret irrecuperabile) → nuova subscription.
    subscriptionId = null;
  }

  const rateNum = quote.rate_num ?? 12;
  const rataNetta = Number(quote.rata_mensile ?? 0);
  const oggi = new Date();
  const cancelAt = Math.floor(oggi.getTime() / 1000) + rateNum * 31 * 24 * 3600;

  const sub = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price_data: {
          currency: "eur",
          // sanifica: tollera spazi/righe multiple incollate per errore nell'env
          product: (process.env.STRIPE_PRODUCT_ID ?? "").trim().split(/\s+/)[0],
          unit_amount: lordo(rataNetta), // addebito LORDO (IVA inclusa)
          recurring: { interval: "month" },
        },
      },
    ],
    // niente addebito automatico: la prima fattura la conferma il cliente nel
    // browser (confirmPayment) → il 3D Secure avviene on-session.
    payment_behavior: "default_incomplete",
    payment_settings: {
      payment_method_types: ["card", "sepa_debit"],
      // il metodo confermato diventa il default per le rate successive.
      save_default_payment_method: "on_subscription",
    },
    cancel_at: cancelAt,
    expand: ["latest_invoice.confirmation_secret"],
    metadata: {
      quote_id: quote.id,
      client_id: client.id,
      contract_id: contractId ?? "",
    },
  });

  // Pre-genera le N rate come "scheduled" (il piano che il cliente vedrà),
  // legate al contratto e alla subscription.
  const rows = Array.from({ length: rateNum }, (_, i) => ({
    client_id: client.id,
    contract_id: contractId,
    subscription_id: sub.id,
    numero_rata: i + 1,
    importo: rataNetta,
    scadenza: scadenzaMese(oggi, i),
    stato: "scheduled" as const,
  }));
  await db.from("payments").insert(rows);
  if (setupId) {
    await db
      .from("payment_setups")
      .update({ stripe_subscription_id: sub.id, stato: "pending" })
      .eq("id", setupId);
  }

  const cs = await confirmationSecret(stripe, sub.latest_invoice);
  return { ...baseCtx, clientSecret: cs, giaPagato: false };
}
