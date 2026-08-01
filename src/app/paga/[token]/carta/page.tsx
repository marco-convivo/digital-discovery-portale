import { notFound } from "next/navigation";
import { ensurePaymentContext } from "@/lib/stripe/setup";
import { PaymentSetup } from "@/components/pay/payment-setup";

// Flusso pagamento con CARTA (Stripe). Il SEPA non passa più da Stripe.
export default async function PagaCartaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ctx = await ensurePaymentContext(token);
  if (!ctx) notFound();
  return <PaymentSetup {...ctx} token={token} />;
}
