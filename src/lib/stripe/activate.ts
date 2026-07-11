import "server-only";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";

type PaymentMetodo = Database["public"]["Enums"]["payment_metodo"];

// L'id subscription sull'Invoice cambia posizione tra versioni API Stripe
// (top-level `subscription` nelle vecchie, `parent.subscription_details` nelle
// nuove): lo cerchiamo in entrambe + nelle righe.
function subIdFromInvoice(inv: Stripe.Invoice): string | null {
  const anyInv = inv as unknown as {
    subscription?: string | null;
    parent?: { subscription_details?: { subscription?: string | null } | null } | null;
    lines?: { data?: Array<{ subscription?: string | null }> } | null;
  };
  return (
    anyInv.subscription ??
    anyInv.parent?.subscription_details?.subscription ??
    anyInv.lines?.data?.find((l) => l.subscription)?.subscription ??
    null
  );
}

function scadenzaMese(base: Date, mesiAvanti: number): string {
  const d = new Date(base);
  d.setMonth(d.getMonth() + mesiAvanti);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function metodoFromSetupIntent(si: Stripe.SetupIntent): Promise<PaymentMetodo | null> {
  const pmId = typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
  if (!pmId) return null;
  const pm = await getStripe().paymentMethods.retrieve(pmId);
  if (pm.type === "sepa_debit") return "sdd";
  if (pm.type === "card") return "carta";
  return null;
}

/**
 * setup_intent.succeeded: il mandato SDD / la carta sono salvati.
 * Crea la subscription (ricorrente) o incassa una tantum, pre-genera le rate,
 * porta il cliente a `pagamento_attivo`. Idempotente sul payment_setup.
 */
export async function handleSetupSucceeded(si: Stripe.SetupIntent): Promise<void> {
  const quoteId = si.metadata?.quote_id;
  const clientId = si.metadata?.client_id;
  const contractId = si.metadata?.contract_id || null;
  if (!quoteId || !clientId) return;

  const db = createAdminClient();

  const psQuery = db
    .from("payment_setups")
    .select("id, stripe_customer_id, stripe_subscription_id")
    .eq("client_id", clientId);
  const { data: ps } = await (contractId
    ? psQuery.eq("contract_id", contractId)
    : psQuery.is("contract_id", null)
  ).maybeSingle();
  if (!ps || ps.stripe_subscription_id) return; // già attivato

  const { data: quote } = await db
    .from("quotes")
    .select("tipo, rata_mensile, rate_num, importo_totale")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) return;

  const stripe = getStripe();
  const pmId = typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
  const customerId =
    typeof si.customer === "string" ? si.customer : si.customer?.id;
  const metodo = await metodoFromSetupIntent(si);
  const oggi = new Date();

  if (quote.tipo === "ricorrente") {
    const rate = quote.rate_num ?? 12;
    const rata = Number(quote.rata_mensile ?? 0);
    const cancelAt = Math.floor(oggi.getTime() / 1000) + rate * 31 * 24 * 3600;

    const sub = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: "eur",
            product: process.env.STRIPE_PRODUCT_ID!,
            unit_amount: Math.round(rata * 100),
            recurring: { interval: "month" },
          },
        },
      ],
      default_payment_method: pmId,
      cancel_at: cancelAt,
      metadata: { quote_id: quoteId, client_id: clientId, contract_id: contractId ?? "" },
    });

    // Pre-genera le N rate come "scheduled" (il piano che il cliente vedrà),
    // legate al contratto.
    const rows = Array.from({ length: rate }, (_, i) => ({
      client_id: clientId,
      contract_id: contractId,
      subscription_id: sub.id,
      numero_rata: i + 1,
      importo: rata,
      scadenza: scadenzaMese(oggi, i),
      stato: "scheduled" as const,
    }));
    await db.from("payments").insert(rows);
    await db
      .from("payment_setups")
      .update({ stripe_subscription_id: sub.id, metodo, stato: "active" })
      .eq("id", ps.id);
  } else {
    // una_tantum / acconto: incasso immediato off-session.
    const importo = Number(quote.importo_totale ?? 0);
    const pi = await stripe.paymentIntents.create({
      customer: customerId,
      amount: Math.round(importo * 100),
      currency: "eur",
      payment_method: pmId,
      off_session: true,
      confirm: true,
      metadata: { quote_id: quoteId, client_id: clientId, contract_id: contractId ?? "" },
    });
    await db.from("payments").insert({
      client_id: clientId,
      contract_id: contractId,
      numero_rata: 1,
      importo,
      scadenza: scadenzaMese(oggi, 0),
      stato: pi.status === "succeeded" ? "paid" : "pending",
      stripe_payment_intent_id: pi.id,
      paid_at: pi.status === "succeeded" ? new Date().toISOString() : null,
    });
    await db
      .from("payment_setups")
      .update({ metodo, stato: "active" })
      .eq("id", ps.id);
  }

  await db.from("clients").update({ stato: "pagamento_attivo" }).eq("id", clientId);
}

/** invoice.paid: segna pagata la prima rata ancora "scheduled" della subscription. */
export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subId = subIdFromInvoice(invoice);
  if (!subId) return;
  const db = createAdminClient();
  const { data: next } = await db
    .from("payments")
    .select("id")
    .eq("subscription_id", subId)
    .eq("stato", "scheduled")
    .order("numero_rata", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!next) return;
  await db
    .from("payments")
    .update({ stato: "paid", paid_at: new Date().toISOString() })
    .eq("id", next.id);
}

/** invoice.payment_failed: segna fallita la prossima rata schedulata (dunning). */
export async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  const subId = subIdFromInvoice(invoice);
  if (!subId) return;
  const db = createAdminClient();
  const { data: next } = await db
    .from("payments")
    .select("id")
    .eq("subscription_id", subId)
    .eq("stato", "scheduled")
    .order("numero_rata", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!next) return;
  await db.from("payments").update({ stato: "failed" }).eq("id", next.id);
}

/** customer.subscription.deleted: il cliente cessa. */
export async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
): Promise<void> {
  const clientId = sub.metadata?.client_id;
  if (!clientId) return;
  const db = createAdminClient();
  await db.from("clients").update({ stato: "cessato" }).eq("id", clientId);
}
