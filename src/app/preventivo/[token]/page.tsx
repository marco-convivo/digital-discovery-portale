import { notFound } from "next/navigation";
import { getPublicQuote } from "@/lib/quotes/public";
import { AcceptPanel } from "@/components/quote/accept-panel";
import { euro, dataIt, conIva } from "@/lib/format";
import { Logo } from "@/components/ui/logo";
import { FlowStepper } from "@/components/flow/flow-stepper";

export default async function PreventivoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const q = await getPublicQuote(token);
  if (!q) notFound();

  const ricorrente = q.tipo === "ricorrente";

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Logo />
        <div className="font-bold">Digital Discovery</div>
      </div>

      <FlowStepper current={1} />

      <header className="mb-8">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-text-3">
          Preventivo n. {q.numero ?? "—"}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.02em] text-balance text-text">
          Preparato per {q.ragioneSociale}
        </h1>
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-pretty text-text-2">
          La vostra presenza digitale, gestita da noi — con un unico referente e
          risultati misurabili.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-text-3">
          <span>Emesso il {dataIt(q.created_at)}</span>
          {q.valido_fino && <span>Valido fino al {dataIt(q.valido_fino)}</span>}
        </div>
      </header>

      {q.servizi.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-4 text-[15px] font-bold text-text">Cosa include</h2>
          <div className="flex flex-col divide-y divide-line overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
            {q.servizi.map((s, i) => (
              <article key={i} className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <h3 className="font-bold text-text">{s.titolo}</h3>
                  {s.meta && (
                    <p className="mt-0.5 text-[12.5px] font-medium text-violet">
                      {s.meta}
                    </p>
                  )}
                  {s.descrizione && (
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-2">
                      {s.descrizione}
                    </p>
                  )}
                  {s.attivita.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {s.attivita.map((a, j) => (
                        <li
                          key={j}
                          className="flex gap-2 text-[12.5px] text-text-2"
                        >
                          <span className="text-violet">✓</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold text-text tnum">{euro(s.prezzo)}</div>
                  <div className="text-[10.5px] font-normal text-text-3">
                    IVA esclusa
                  </div>
                </div>
              </article>
            ))}
            {q.sconto > 0 && (
              <div className="flex items-center justify-between gap-4 bg-mint-soft/50 p-5">
                <span className="text-[13.5px] font-semibold text-text">
                  Sconto applicato
                </span>
                <span className="font-bold text-on-mint tnum">
                  −{euro(q.sconto)}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Il piano: la rata è l'eroe, il totale è minimizzato. */}
      <section className="mb-8 overflow-hidden rounded-card bg-ink text-on-ink shadow-card">
        {ricorrente ? (
          <div className="p-6 sm:p-7">
            <p className="text-[13px] font-semibold text-on-ink/60">
              Il tuo piano
            </p>
            <div className="mt-1.5 flex items-end gap-2">
              <span className="text-5xl font-extrabold tracking-[-0.03em]">
                {euro(q.rata_mensile)}
              </span>
              <span className="mb-1.5 text-lg font-semibold text-on-ink/70">
                /mese
              </span>
            </div>
            <p className="mt-1 text-[13px] text-on-ink/55">
              {euro(conIva(q.rata_mensile))} IVA inclusa (22%)
            </p>
            <p className="mt-1 text-[14px] text-on-ink/70">
              {`per ${q.rate_num ?? "—"} mesi · prima rata all'attivazione`}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-mint-soft px-3 py-1.5 text-[13px] font-bold text-on-mint">
                <span aria-hidden>✓</span> Senza anticipo
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-mint-soft px-3 py-1.5 text-[13px] font-bold text-on-mint">
                <span aria-hidden>✓</span> Tasso zero
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-on-ink/15 pt-3.5 text-[13px] text-on-ink/60">
              <span>
                Totale{" "}
                <span className="font-semibold text-on-ink/90 tnum">
                  {euro(q.importo_totale)}
                </span>{" "}
                imponibile · {euro(conIva(q.importo_totale))} IVA inclusa
              </span>
              <span>Addebito SDD o carta aziendale</span>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-7">
            <p className="text-[13px] font-semibold text-on-ink/60">Importo</p>
            <div className="mt-1.5 text-5xl font-extrabold tracking-[-0.03em]">
              {euro(q.importo_totale)}
            </div>
            <p className="mt-1 text-[13px] text-on-ink/55">
              {euro(conIva(q.importo_totale))} IVA inclusa (22%)
            </p>
            <p className="mt-2 text-[14px] text-on-ink/70">
              Pagamento unico · SDD o carta aziendale
            </p>
          </div>
        )}
      </section>

      <AcceptPanel token={token} alreadyAccepted={q.stato === "accettato"} />

      <footer className="mt-10 text-center text-[12px] text-text-3">
        Digital Discovery S.r.l. · Firma online, nessun cartaceo
      </footer>
    </main>
  );
}
