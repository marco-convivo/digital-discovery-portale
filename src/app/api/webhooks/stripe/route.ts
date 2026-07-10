import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";

// Webhook Stripe. Verifica la firma sul body RAW (niente parsing prima).
// Le transizioni di stato vere si aggancieranno qui (scheletro per ora).
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) {
    return NextResponse.json({ error: "webhook non configurato" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "firma non valida";
    return NextResponse.json({ error: `firma: ${msg}` }, { status: 400 });
  }

  // TODO FASE 2 — instradare alle transizioni (con createAdminClient, service role):
  //   setup_intent.succeeded / mandato attivo -> pagamento_attivo + crea subscription
  //   invoice.paid            -> payments.stato = paid
  //   invoice.payment_failed  -> payments.stato = failed + dunning
  //   customer.subscription.deleted -> cliente cessato
  switch (event.type) {
    case "setup_intent.succeeded":
    case "invoice.paid":
    case "invoice.payment_failed":
    case "customer.subscription.deleted":
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
