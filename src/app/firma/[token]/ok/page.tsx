import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";

export default async function FirmaOkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6">
      <div className="w-full rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
        <div className="mb-4 flex justify-center">
          <StatusPill tone="paid">Contratto firmato</StatusPill>
        </div>
        <h1 className="text-lg font-extrabold text-text">Firma completata ✓</h1>
        <p className="mt-2 text-sm text-text-2">
          Grazie! Ultimo passo: imposta il metodo di pagamento per attivare i
          servizi.
        </p>
        <Link
          href={`/paga/${token}`}
          className="mt-6 inline-flex rounded-pill bg-ink px-5 py-2.5 text-[13.5px] font-bold text-on-ink hover:bg-ink/90"
        >
          Imposta il pagamento →
        </Link>
      </div>
    </main>
  );
}
