import { notFound } from "next/navigation";
import { ensurePaymentContext } from "@/lib/stripe/setup";
import { PaymentSetup } from "@/components/pay/payment-setup";

export default async function PagaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ctx = await ensurePaymentContext(token);
  if (!ctx) notFound();
  return <PaymentSetup {...ctx} token={token} />;
}
