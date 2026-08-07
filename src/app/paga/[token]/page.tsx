import Link from "next/link";
import { notFound } from "next/navigation";
import { getPagamentoInfo } from "@/lib/pagamento";
import { Logo } from "@/components/ui/logo";
import { FlowStepper } from "@/components/flow/flow-stepper";
import { conIva, euro } from "@/lib/format";

function euroSafe(n: number | null): string {
  return n == null ? "—" : euro(n);
}

export default async function PagaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const info = await getPagamentoInfo(token);
  if (!info) notFound();

  const ricorrente = info.tipo === "ricorrente";
  const unaTantum = info.tipo === "una_tantum";

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

      {info.giaImpostato ? (
        <div className="rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
          <h1 className="text-lg font-extrabold tracking-[-0.01em] text-text">
            Pagamento già impostato
          </h1>
          <p className="mt-2 text-sm text-text-2">
            Il pagamento per {info.ragioneSociale} risulta già configurato.
            Trovi tutto nella tua area riservata.
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
          <h1 className="text-lg font-extrabold tracking-[-0.01em] text-text">
            {info.ragioneSociale}
          </h1>
          <p className="mt-0.5 text-sm text-text-2">
            {ricorrente
              ? `${euroSafe(info.rata_mensile)}/mese · ${info.rate_num ?? "—"} mesi (${euroSafe(conIva(info.rata_mensile))} IVA incl.)`
              : `${euroSafe(info.importo_totale)} (${euroSafe(conIva(info.importo_totale))} IVA incl.)`}
          </p>

          <p className="mt-5 text-[13px] font-semibold text-text-2">
            Come vuoi pagare?
          </p>

          <div className="mt-3 flex flex-col gap-3">
            <Link
              href={`/paga/${token}/carta`}
              className="flex items-center gap-3.5 rounded-md border border-line p-4 transition-colors hover:border-ink hover:bg-card-2"
            >
              <span className="grid size-11 flex-none place-items-center rounded-[13px] bg-card-2 text-text">
                <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-text">Carta</span>
                <span className="block text-[12.5px] text-text-3">
                  Attivazione immediata, addebito automatico
                </span>
              </span>
              <span className="flex-none text-text-3" aria-hidden>›</span>
            </Link>

            {/* SEPA (addebito ricorrente): non per le una tantum */}
            {!unaTantum && (
              <Link
                href={`/paga/${token}/sepa`}
                className="flex items-center gap-3.5 rounded-md border border-line p-4 transition-colors hover:border-ink hover:bg-card-2"
              >
                <span className="grid size-11 flex-none place-items-center rounded-[13px] bg-card-2 text-text">
                  <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M4 10h16M5 10 12 4l7 6M6 10v11M18 10v11M10 10v11M14 10v11" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-text">
                    Addebito bancario (SEPA)
                  </span>
                  <span className="block text-[12.5px] text-text-3">
                    Compili il mandato con il tuo IBAN
                  </span>
                </span>
                <span className="flex-none text-text-3" aria-hidden>›</span>
              </Link>
            )}

            {/* Bonifico: solo per pagamenti in un'unica soluzione */}
            {unaTantum && (
              <Link
                href={`/paga/${token}/bonifico`}
                className="flex items-center gap-3.5 rounded-md border border-line p-4 transition-colors hover:border-ink hover:bg-card-2"
              >
                <span className="grid size-11 flex-none place-items-center rounded-[13px] bg-card-2 text-text">
                  <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 9h18M7 14h4" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-text">
                    Bonifico bancario
                  </span>
                  <span className="block text-[12.5px] text-text-3">
                    Paghi l&apos;intero importo con i nostri dati IBAN
                  </span>
                </span>
                <span className="flex-none text-text-3" aria-hidden>›</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
