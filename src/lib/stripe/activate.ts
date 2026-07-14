import "server-only";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviaAccessoPortale } from "@/lib/portale/welcome";
import { motivoInsoluto } from "@/lib/stripe/insoluti-reason";
import { inviaAlertInsoluto } from "@/lib/insoluti/alert";
import { inviaConfermaMandato } from "@/lib/pagamenti/mandato";
import { getAppSettingsAdmin } from "@/lib/settings/app-settings";
import { ALIQUOTA_IVA, conIva } from "@/lib/format";
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
  if (!ps) return;

  const stripe = getStripe();
  const pmId = typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
  const customerId =
    typeof si.customer === "string" ? si.customer : si.customer?.id;
  const metodo = await metodoFromSetupIntent(si);
  const oggi = new Date();

  // Flusso "nuovo mandato": la subscription esiste già → non ricrearla, ma
  // ripuntarla al nuovo metodo di pagamento e ritentare le rate insolute.
  if (ps.stripe_subscription_id) {
    if (!pmId) return;
    await stripe.subscriptions.update(ps.stripe_subscription_id, {
      default_payment_method: pmId,
    });
    await db.from("payment_setups").update({ metodo }).eq("id", ps.id);
    const { data: falliti } = await db
      .from("payments")
      .select("stripe_invoice_id")
      .eq("subscription_id", ps.stripe_subscription_id)
      .eq("stato", "failed")
      .not("stripe_invoice_id", "is", null);
    for (const f of (falliti ?? []) as { stripe_invoice_id: string | null }[]) {
      if (!f.stripe_invoice_id) continue;
      try {
        await stripe.invoices.pay(f.stripe_invoice_id, { payment_method: pmId });
      } catch {
        // best-effort: l'esito lo scrivono i webhook invoice.paid/payment_failed
      }
    }
    return;
  }

  const { data: quote } = await db
    .from("quotes")
    .select("tipo, rata_mensile, rate_num, importo_totale")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) return;

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
            // sanifica: tollera spazi/righe multiple incollate per errore nell'env
            product: (process.env.STRIPE_PRODUCT_ID ?? "").trim().split(/\s+/)[0],
            // addebito LORDO (IVA inclusa): il netto è in quote.rata_mensile
            unit_amount: Math.round(rata * (1 + ALIQUOTA_IVA) * 100),
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
      amount: Math.round(importo * (1 + ALIQUOTA_IVA) * 100), // lordo (IVA inclusa)
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

  // Invito di accesso al portale (magic link) — best-effort, non blocca il flusso.
  const { data: cli } = await db
    .from("clients")
    .select("email, ragione_sociale")
    .eq("id", clientId)
    .maybeSingle();
  const cliRow = cli as { email: string | null; ragione_sociale: string } | null;
  await inviaAccessoPortale(cliRow?.email);

  // Conferma mandato SEPA per i piani ricorrenti pagati con addebito diretto.
  if (metodo === "sdd" && quote.tipo === "ricorrente" && cliRow) {
    const { statement_descriptor } = await getAppSettingsAdmin();
    await inviaConfermaMandato({
      email: cliRow.email,
      ragioneSociale: cliRow.ragione_sociale,
      rataLorda: conIva(Number(quote.rata_mensile ?? 0)),
      rateNum: quote.rate_num ?? 12,
      descriptor: statement_descriptor,
    });
  }
}

// Trova (o aggancia stabilmente) la rata di un invoice di subscription: alla
// prima comparsa dell'invoice lo si assegna alla prima rata senza invoice; dopo
// si matcha sempre per stripe_invoice_id (i retry colpiscono la stessa rata).
async function rataPerInvoice(
  db: ReturnType<typeof createAdminClient>,
  subId: string,
  invoiceId: string,
): Promise<{ id: string } | null> {
  const { data: byInv } = await db
    .from("payments")
    .select("id")
    .eq("stripe_invoice_id", invoiceId)
    .maybeSingle();
  if (byInv) return byInv as { id: string };

  const { data: libera } = await db
    .from("payments")
    .select("id")
    .eq("subscription_id", subId)
    .is("stripe_invoice_id", null)
    .order("numero_rata", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!libera) return null;
  const id = (libera as { id: string }).id;
  await db.from("payments").update({ stripe_invoice_id: invoiceId }).eq("id", id);
  return { id };
}

/** invoice.paid: segna pagata la rata di quell'invoice (idempotente; chiude un eventuale recupero). */
export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subId = subIdFromInvoice(invoice);
  if (!subId || !invoice.id) return;
  const db = createAdminClient();
  const rata = await rataPerInvoice(db, subId, invoice.id);
  if (!rata) return;
  await db
    .from("payments")
    .update({
      stato: "paid",
      paid_at: new Date().toISOString(),
      recovery_stato: "nessuno",
      failure_code: null,
      failure_reason: null,
    })
    .eq("id", rata.id);
}

/** invoice.payment_failed: marca insoluta la rata dell'invoice, salva motivo, avvisa. */
export async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  const subId = subIdFromInvoice(invoice);
  if (!subId || !invoice.id) return;
  const db = createAdminClient();
  const rata = await rataPerInvoice(db, subId, invoice.id);
  if (!rata) return;

  // reason: dal charge collegato o da last_finalization_error
  let code: string | null = null;
  const anyInv = invoice as unknown as {
    last_finalization_error?: { code?: string } | null;
    charge?: string | null;
  };
  if (anyInv.charge) {
    try {
      const ch = await getStripe().charges.retrieve(anyInv.charge);
      code = ch.failure_code ?? ch.outcome?.reason ?? null;
    } catch {
      // ignora: usiamo il fallback sotto
    }
  }
  code = code ?? anyInv.last_finalization_error?.code ?? null;
  const { code: c, reason } = motivoInsoluto(code);

  const { data: cur } = await db
    .from("payments")
    .select("attempts")
    .eq("id", rata.id)
    .maybeSingle();
  const attempts = ((cur as { attempts: number } | null)?.attempts ?? 0) + 1;

  await db
    .from("payments")
    .update({
      stato: "failed",
      failure_code: c,
      failure_reason: reason,
      failed_at: new Date().toISOString(),
      attempts,
      recovery_stato: "da_recuperare",
    })
    .eq("id", rata.id);

  await inviaAlertInsoluto(rata.id);
}

/** payment_intent.succeeded: recupero carta andato a buon fine → rata pagata. */
export async function handleRecoveryPaid(
  pi: Stripe.PaymentIntent,
): Promise<void> {
  const paymentId = pi.metadata?.payment_id;
  if (!paymentId || pi.metadata?.tipo !== "recupero") return;
  const db = createAdminClient();
  await db
    .from("payments")
    .update({
      stato: "paid",
      paid_at: new Date().toISOString(),
      recovery_stato: "recuperato",
    })
    .eq("id", paymentId);
}

/**
 * charge.dispute.created: ritorno tardivo (l'insoluto arriva DOPO un "pagato").
 * Riapre la rata come insoluta e avvisa.
 */
export async function handleChargeDispute(dispute: Stripe.Dispute): Promise<void> {
  const chargeId =
    typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return;
  const db = createAdminClient();
  const stripe = getStripe();

  let rataId: string | null = null;
  try {
    const ch = await stripe.charges.retrieve(chargeId);
    const anyCh = ch as unknown as {
      invoice?: string | null;
      payment_intent?: string | null;
    };
    if (anyCh.invoice) {
      const { data } = await db
        .from("payments")
        .select("id")
        .eq("stripe_invoice_id", anyCh.invoice)
        .maybeSingle();
      rataId = (data as { id: string } | null)?.id ?? null;
    }
    if (!rataId && anyCh.payment_intent) {
      const pi = await stripe.paymentIntents.retrieve(anyCh.payment_intent);
      rataId = pi.metadata?.payment_id ?? null;
    }
  } catch {
    return;
  }
  if (!rataId) return;

  const { data: cur } = await db
    .from("payments")
    .select("attempts")
    .eq("id", rataId)
    .maybeSingle();
  const attempts = ((cur as { attempts: number } | null)?.attempts ?? 0) + 1;

  await db
    .from("payments")
    .update({
      stato: "failed",
      recovery_stato: "da_recuperare",
      failure_code: "DISPUTE",
      failure_reason: "Addebito stornato/contestato dopo l'incasso.",
      failed_at: new Date().toISOString(),
      attempts,
    })
    .eq("id", rataId);

  await inviaAlertInsoluto(rataId);
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
