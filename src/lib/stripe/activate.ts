import "server-only";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviaAccessoPortale } from "@/lib/portale/welcome";
import { motivoInsoluto } from "@/lib/stripe/insoluti-reason";
import { inviaAlertInsoluto } from "@/lib/insoluti/alert";
import { inviaAvvisoInsolutoCliente } from "@/lib/insoluti/cliente-email";
import { transizioneCliente } from "@/lib/stato/transizione";
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

async function metodoFromPmId(pmId: string | null): Promise<PaymentMetodo | null> {
  if (!pmId) return null;
  const pm = await getStripe().paymentMethods.retrieve(pmId);
  if (pm.type === "sepa_debit") return "sdd";
  if (pm.type === "card") return "carta";
  return null;
}


async function metodoFromSubscription(sub: Stripe.Subscription): Promise<PaymentMetodo | null> {
  const pm = sub.default_payment_method;
  return metodoFromPmId(typeof pm === "string" ? pm : (pm?.id ?? null));
}

async function metodoFromPaymentIntent(pi: Stripe.PaymentIntent): Promise<PaymentMetodo | null> {
  const pm = pi.payment_method;
  return metodoFromPmId(typeof pm === "string" ? pm : (pm?.id ?? null));
}

/**
 * Porta il cliente ad `attivo` al PRIMO incasso confermato e invia l'accesso
 * al portale. La transizione passa da transizione_cliente() ed è atomica:
 * solo il primo evento che la vince (changed=true) manda le email, così
 * invoice.paid, customer.subscription.updated e payment_intent.succeeded
 * restano idempotenti tra loro.
 */
async function attivaClientePagamento(
  db: ReturnType<typeof createAdminClient>,
  opts: { clientId: string; quoteId?: string | null; metodo?: PaymentMetodo | null },
): Promise<void> {
  const esito = await transizioneCliente(
    db,
    opts.clientId,
    "primo_incasso",
    "webhook:stripe",
  );
  if (!esito.changed) return; // già attivato da un altro evento

  const { data: cli } = await db
    .from("clients")
    .select("email")
    .eq("id", opts.clientId)
    .maybeSingle();
  await inviaAccessoPortale((cli as { email: string | null } | null)?.email ?? null);
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

/**
 * invoice.paid: segna pagata la rata di quell'invoice (idempotente; chiude un
 * eventuale recupero). Al PRIMO incasso (subscription_create) attiva anche il
 * cliente e invia gli avvisi — nel flusso on-session la subscription nasce
 * `default_incomplete` e si attiva solo quando la prima fattura è pagata.
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subId = subIdFromInvoice(invoice);
  if (!subId || !invoice.id) return;
  const db = createAdminClient();

  const rata = await rataPerInvoice(db, subId, invoice.id);
  if (rata) {
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

  const isFirst =
    (invoice as unknown as { billing_reason?: string }).billing_reason ===
    "subscription_create";
  if (!isFirst) return;

  const sub = await getStripe().subscriptions.retrieve(subId, {
    expand: ["default_payment_method"],
  });
  const clientId = sub.metadata?.client_id;
  if (!clientId) return;
  const metodo = await metodoFromSubscription(sub);
  await db
    .from("payment_setups")
    .update({ metodo, stato: "attivo" })
    .eq("stripe_subscription_id", subId);
  await attivaClientePagamento(db, {
    clientId,
    quoteId: sub.metadata?.quote_id ?? null,
    metodo,
  });
}

/**
 * customer.subscription.updated: per l'addebito SEPA la subscription può passare
 * ad `active` quando la banca conferma (giorni dopo la firma). Attiva il cliente
 * anche da qui — idempotente con invoice.paid grazie all'UPDATE atomico.
 */
export async function handleSubscriptionUpdated(
  sub: Stripe.Subscription,
): Promise<void> {
  if (sub.status !== "active" && sub.status !== "trialing") return;
  const clientId = sub.metadata?.client_id;
  if (!clientId) return;
  const db = createAdminClient();
  const metodo = await metodoFromSubscription(sub);
  await db
    .from("payment_setups")
    .update({ metodo, stato: "attivo" })
    .eq("stripe_subscription_id", sub.id);
  await attivaClientePagamento(db, {
    clientId,
    quoteId: sub.metadata?.quote_id ?? null,
    metodo,
  });
}

// Stato reale del pagamento della fattura + motivo. Per SEPA il PaymentIntent
// resta 'processing' (in elaborazione, NON fallito). Best-effort su più
// versioni API (invoice.payment_intent vecchie, invoice.payments nuove).
async function invoicePaymentState(
  invoice: Stripe.Invoice,
): Promise<{ status: string | null; reasonCode: string | null }> {
  const anyInv = invoice as unknown as {
    id?: string;
    payment_intent?: string | { id?: string } | null;
  };
  let piId: string | null =
    typeof anyInv.payment_intent === "string"
      ? anyInv.payment_intent
      : (anyInv.payment_intent?.id ?? null);
  if (!piId && anyInv.id) {
    try {
      const full = (await getStripe().invoices.retrieve(anyInv.id, {
        expand: ["payments"],
      })) as unknown as {
        payment_intent?: string | null;
        payments?: {
          data?: Array<{
            payment_intent?: string | null;
            payment?: { payment_intent?: string | null };
          }>;
        };
      };
      const p = full.payments?.data?.[0];
      piId =
        (typeof full.payment_intent === "string" ? full.payment_intent : null) ??
        p?.payment?.payment_intent ??
        p?.payment_intent ??
        null;
    } catch {
      // best-effort
    }
  }
  if (!piId) return { status: null, reasonCode: null };
  try {
    const pi = await getStripe().paymentIntents.retrieve(piId);
    const reasonCode =
      pi.last_payment_error?.code ?? pi.last_payment_error?.decline_code ?? null;
    return { status: pi.status, reasonCode };
  } catch {
    return { status: null, reasonCode: null };
  }
}

/**
 * invoice.payment_failed: per i pagamenti asincroni (SEPA) Stripe invia questo
 * evento anche quando il pagamento è solo IN ELABORAZIONE (PaymentIntent
 * 'processing') → NON è un insoluto. Marchiamo insoluto solo su un fallimento
 * reale; altrimenti la rata resta 'pending' (si chiude con invoice.paid).
 */
export async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  const subId = subIdFromInvoice(invoice);
  if (!subId || !invoice.id) return;
  const db = createAdminClient();
  const rata = await rataPerInvoice(db, subId, invoice.id);
  if (!rata) return;

  const { status, reasonCode } = await invoicePaymentState(invoice);
  const isFirst =
    (invoice as unknown as { billing_reason?: string }).billing_reason ===
    "subscription_create";

  // Pagamento asincrono ancora in corso (SEPA) → in elaborazione, non insoluto.
  if (status === "processing") {
    await db.from("payments").update({ stato: "pending" }).eq("id", rata.id);
    return;
  }

  // PRIMO addebito non completato (carta da autenticare/rifiutata, SEPA non
  // ancora partito): il cliente deve COMPLETARE la fattura (o rifare /paga),
  // non è un insoluto da recuperare con link maggiorato. La rata resta
  // 'pending', avvisiamo solo lo staff (niente email di sollecito al cliente).
  if (isFirst) {
    await db.from("payments").update({ stato: "pending" }).eq("id", rata.id);
    await inviaAlertInsoluto(rata.id);
    return;
  }

  const { code: c, reason } = motivoInsoluto(reasonCode);
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
  await inviaAvvisoInsolutoCliente(rata.id);
}

/**
 * payment_intent.succeeded. Due casi, distinti dal metadata `tipo`:
 *  - "recupero": recupero carta di un insoluto → rata pagata;
 *  - "iniziale": primo (e unico) incasso di un piano una tantum → rata pagata +
 *    cliente attivato + avvisi.
 */
export async function handlePaymentIntentSucceeded(
  pi: Stripe.PaymentIntent,
): Promise<void> {
  const db = createAdminClient();

  if (pi.metadata?.tipo === "recupero") {
    const paymentId = pi.metadata?.payment_id;
    if (!paymentId) return;
    await db
      .from("payments")
      .update({
        stato: "paid",
        paid_at: new Date().toISOString(),
        recovery_stato: "recuperato",
      })
      .eq("id", paymentId);
    return;
  }

  if (pi.metadata?.tipo === "iniziale") {
    await db
      .from("payments")
      .update({ stato: "paid", paid_at: new Date().toISOString() })
      .eq("stripe_payment_intent_id", pi.id);
    const clientId = pi.metadata?.client_id;
    if (!clientId) return;
    const contractId = pi.metadata?.contract_id || null;
    const metodo = await metodoFromPaymentIntent(pi);
    const psUpd = db
      .from("payment_setups")
      .update({ metodo, stato: "attivo" })
      .eq("client_id", clientId);
    await (contractId
      ? psUpd.eq("contract_id", contractId)
      : psUpd.is("contract_id", null));
    await attivaClientePagamento(db, {
      clientId,
      quoteId: pi.metadata?.quote_id ?? null,
      metodo,
    });
  }
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
  await inviaAvvisoInsolutoCliente(rataId);
}

/**
 * customer.subscription.deleted — fine piano ≠ cessazione.
 * La subscription nasce con `cancel_at` a fine piano: quando il cliente FINISCE
 * di pagare regolarmente Stripe emette comunque questo evento. Se tutte le rate
 * del contratto sono incassate il contratto va a 'completato' e il cliente
 * resta attivo; solo se restano rate non pagate è una vera cessazione.
 */
export async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
): Promise<void> {
  const clientId = sub.metadata?.client_id;
  if (!clientId) return;
  const db = createAdminClient();

  const contractId = sub.metadata?.contract_id || null;
  const { data: rate } = await db
    .from("payments")
    .select("stato")
    .eq("subscription_id", sub.id);
  const aperte = (rate ?? []).filter((r) =>
    ["scheduled", "pending", "failed"].includes(String(r.stato)),
  ).length;

  if ((rate ?? []).length > 0 && aperte === 0) {
    // Piano completato: contratto chiuso positivamente, cliente resta attivo.
    if (contractId) {
      await db
        .from("contracts")
        .update({ stato: "completato" })
        .eq("id", contractId)
        .eq("stato", "firmato");
    }
    return;
  }

  await transizioneCliente(db, clientId, "cessato", "webhook:stripe");
}
