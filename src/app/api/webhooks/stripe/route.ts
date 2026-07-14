import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import {
  handleSetupSucceeded,
  handleInvoicePaid,
  handleInvoiceFailed,
  handleSubscriptionDeleted,
  handleRecoveryPaid,
} from "@/lib/stripe/activate";

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

  // Instrada l'evento alla transizione di stato (handler con service role).
  try {
    switch (event.type) {
      case "setup_intent.succeeded":
        await handleSetupSucceeded(event.data.object as Stripe.SetupIntent);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "checkout.session.completed":
        await handleRecoveryPaid(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        break;
    }
  } catch (err) {
    // 500 -> Stripe riprova l'evento (i webhook devono essere idempotenti).
    const msg = err instanceof Error ? err.message : "errore handler";
    console.error(`[stripe webhook] ${event.type}:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
