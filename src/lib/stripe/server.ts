import Stripe from "stripe";

// Client Stripe server-side (lazy: non costruito al load del modulo).
// Usa la secret key; MAI importare in codice client.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}
