import { notFound } from "next/navigation";
import Link from "next/link";
import { ensureContractForToken } from "@/lib/docuseal/contract";
import { SignEmbed } from "@/components/firma/sign-embed";
import { StatusPill } from "@/components/ui/status-pill";

export default async function FirmaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ctx = await ensureContractForToken(token);
  if (!ctx) notFound();

  if (ctx.status === "firmato") {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6">
        <div className="w-full rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
          <div className="mb-4 flex justify-center">
            <StatusPill tone="paid">Contratto firmato</StatusPill>
          </div>
          <h1 className="text-lg font-extrabold text-text">Già firmato</h1>
          <p className="mt-2 text-sm text-text-2">
            Questo contratto risulta già firmato.
          </p>
          <Link
            href={`/paga/${token}`}
            className="mt-5 inline-block font-semibold text-violet hover:underline"
          >
            Vai all&apos;impostazione del pagamento →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-[11px] bg-ink text-base font-extrabold text-on-ink">
          D
        </div>
        <div className="leading-tight">
          <div className="font-bold">Digital Discovery</div>
          <div className="text-[12px] text-text-3">Firma del contratto</div>
        </div>
      </div>
      <h1 className="mb-1 text-2xl font-extrabold tracking-[-0.02em] text-text">
        {ctx.ragioneSociale}
      </h1>
      <p className="mb-6 text-sm text-text-2">
        Rivedi il contratto e firma online. Dopo la firma imposti il pagamento.
      </p>

      <div className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
        <SignEmbed src={ctx.embedSrc} token={token} />
      </div>
    </main>
  );
}
