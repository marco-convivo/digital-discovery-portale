import Link from "next/link";
import { notFound } from "next/navigation";
import { getPagamentoInfo } from "@/lib/pagamento";
import { Logo } from "@/components/ui/logo";
import { FlowStepper } from "@/components/flow/flow-stepper";
import { MandatoSepaForm } from "@/components/pay/mandato-sepa-form";

export default async function PagaSepaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await getPagamentoInfo(token);
  if (!info) notFound();

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <div className="mb-6 flex items-center gap-3">
        <Logo />
        <div className="leading-tight">
          <div className="font-bold">Digital Discovery</div>
          <div className="text-[12px] text-text-3">Attiva il pagamento</div>
        </div>
      </div>

      <FlowStepper current={4} />

      {!info.giaImpostato && (
        <Link
          href={`/paga/${token}`}
          className="mb-3 inline-block text-[13px] font-semibold text-text-2 hover:text-text"
        >
          ← Altro metodo
        </Link>
      )}

      {info.giaImpostato ? (
        <div className="rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
          <h1 className="text-lg font-extrabold tracking-[-0.01em] text-text">
            Pagamento già impostato
          </h1>
          <p className="mt-2 text-sm text-text-2">
            Il pagamento per {info.ragioneSociale} risulta già configurato.
          </p>
          <a
            href="/accedi"
            className="mt-5 inline-block rounded-pill bg-ink px-5 py-2.5 text-[14px] font-semibold text-on-ink transition-opacity hover:opacity-90"
          >
            Accedi al tuo portale
          </a>
        </div>
      ) : (
        <MandatoSepaForm
          token={token}
          ragioneSociale={info.ragioneSociale}
          defaults={{
            intestatario: info.ragioneSociale,
            indirizzo: info.indirizzo ?? "",
            email: info.email ?? "",
          }}
        />
      )}
    </main>
  );
}
