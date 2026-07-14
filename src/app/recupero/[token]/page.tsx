import { notFound } from "next/navigation";
import { ensureRecoveryContext } from "@/lib/stripe/recupero";
import { RecuperoPayment } from "@/components/pay/recupero-payment";

export default async function RecuperoTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ctx = await ensureRecoveryContext(token);
  if (!ctx) notFound();
  return <RecuperoPayment {...ctx} />;
}
