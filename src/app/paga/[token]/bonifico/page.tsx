import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPagamentoInfo } from "@/lib/pagamento";
import { BONIFICO } from "@/lib/bonifico/config";
import { BonificoConferma } from "@/components/pay/bonifico-conferma";
import { Logo } from "@/components/ui/logo";
import { FlowStepper } from "@/components/flow/flow-stepper";
import { conIva, euro } from "@/lib/format";

function Riga({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-line py-2.5 first:border-t-0">
      <span className="text-[13px] text-text-3">{label}</span>
      <span className="text-right text-[14px] font-semibold text-text">{value}</span>
    </div>
  );
}

export default async function BonificoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await getPagamentoInfo(token);
  if (!info) notFound();
  // Il bonifico è solo per i pagamenti in un'unica soluzione (una tantum).
  if (info.tipo !== "una_tantum") redirect(`/paga/${token}`);

  const lordo = euro(conIva(info.importo_totale));

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <div className="mb-6 flex items-center gap-3">
        <Logo />
        <div className="leading-tight">
          <div className="font-bold">Digital Discovery</div>
          <div className="text-[12px] text-text-3">Pagamento con bonifico</div>
        </div>
      </div>

      <FlowStepper current={4} />

      {info.giaImpostato ? (
        <div className="rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
          <h1 className="text-lg font-extrabold tracking-[-0.01em] text-text">
            Pagamento già impostato
          </h1>
          <p className="mt-2 text-sm text-text-2">
            Per {info.ragioneSociale} il pagamento risulta già configurato.
          </p>
          <a
            href="/accedi"
            className="mt-5 inline-block rounded-pill bg-ink px-5 py-2.5 text-[14px] font-semibold text-on-ink transition-opacity hover:opacity-90"
          >
            Accedi al tuo portale
          </a>
        </div>
      ) : (
        <div className="rounded-card border border-line/60 bg-card p-6 shadow-card">
          <Link
            href={`/paga/${token}`}
            className="text-[13px] font-semibold text-text-2 hover:text-text"
          >
            ← Altri metodi
          </Link>

          <h1 className="mt-3 text-lg font-extrabold tracking-[-0.01em] text-text">
            Paga con bonifico
          </h1>
          <p className="mt-0.5 text-sm text-text-2">
            {info.ragioneSociale} · <b>{lordo}</b> (IVA inclusa), in un&apos;unica
            soluzione.
          </p>

          <div className="mt-5 rounded-md bg-card-2 p-4">
            <Riga label="Intestato a" value={BONIFICO.intestatario} />
            <Riga label="IBAN" value={BONIFICO.iban} />
            <Riga label="Banca" value={BONIFICO.banca} />
            <Riga label="Importo" value={lordo} />
            <Riga label="Causale" value={info.numero ?? "—"} />
          </div>

          <div className="mt-4 rounded-md border border-line p-4 text-[13.5px] leading-relaxed text-text-2">
            <p>
              <b>Come procedere</b>
            </p>
            <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-4">
              <li>
                Esegui il bonifico all&apos;IBAN indicato, inserendo come{" "}
                <b>causale il numero preventivo</b>: {info.numero ?? "—"}.
              </li>
              <li>
                Invia la <b>copia contabile</b> a{" "}
                <a
                  href={`mailto:${BONIFICO.emailContabile}`}
                  className="font-semibold text-link hover:underline"
                >
                  {BONIFICO.emailContabile}
                </a>
                .
              </li>
              <li>
                Alla ricezione attiviamo il tuo accesso al portale e ti
                confermiamo l&apos;incasso.
              </li>
            </ol>
          </div>

          <div className="mt-5">
            <BonificoConferma token={token} />
          </div>
        </div>
      )}
    </main>
  );
}
