import { notFound } from "next/navigation";
import { getPublicQuote } from "@/lib/quotes/public";
import { AcceptPanel } from "@/components/quote/accept-panel";
import { euro, dataIt } from "@/lib/format";

const TIPO_LABEL: Record<string, string> = {
  ricorrente: "Ricorrente",
  una_tantum: "Una tantum",
  acconto: "Acconto",
};

export default async function PreventivoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const q = await getPublicQuote(token);
  if (!q) notFound();

  const ricorrente = q.tipo === "ricorrente";
  const formula = ricorrente
    ? `Ricorrente · ${q.rate_num ?? "—"} mesi`
    : TIPO_LABEL[q.tipo] ?? q.tipo;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-[11px] bg-ink text-base font-extrabold text-on-ink">
          D
        </div>
        <div className="font-bold">Digital Discovery</div>
      </div>

      <header className="mb-8">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-text-3">
          Preventivo n. {q.numero ?? "—"}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.02em] text-text">
          Preparato per {q.ragioneSociale}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-text-2">
          La vostra presenza digitale, gestita da noi — con un unico referente e
          risultati misurabili.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-text-3">
          <span>Emesso il {dataIt(q.created_at)}</span>
          {q.valido_fino && <span>Valido fino al {dataIt(q.valido_fino)}</span>}
        </div>
      </header>

      {q.items.length > 0 && (
        <section className="mb-6 rounded-card border border-line/60 bg-card p-6 shadow-card">
          <h2 className="mb-4 text-[15px] font-bold text-text">Cosa include</h2>
          <ul className="flex flex-col gap-4">
            {q.items.map((it, i) => (
              <li key={i} className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-text">{it.descrizione}</div>
                </div>
                <div className="shrink-0 text-right font-bold text-text">
                  {euro(it.prezzo_unitario)}
                  {ricorrente && (
                    <span className="text-[12px] font-medium text-text-3">
                      /mese
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 rounded-card border border-line/60 bg-card p-6 shadow-card">
        <h2 className="mb-4 text-[15px] font-bold text-text">
          Condizioni di pagamento
        </h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Formula" value={formula} />
          {ricorrente && (
            <Field label="Rate" value={`${q.rate_num ?? "—"} mensili`} />
          )}
          <Field label="Metodo" value="SDD o carta" />
          <Field
            label={ricorrente ? "Rata mensile" : "Importo"}
            value={euro(ricorrente ? q.rata_mensile : q.importo_totale)}
            strong
          />
        </dl>
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-text-2">
              Totale contratto
            </span>
            <span className="text-xl font-extrabold text-text">
              {euro(q.importo_totale)}
            </span>
          </div>
          <p className="mt-2 text-[12px] text-text-3">
            Importi IVA esclusa. Prima rata all&apos;attivazione del mandato.
          </p>
        </div>
      </section>

      <AcceptPanel token={token} alreadyAccepted={q.stato === "accettato"} />

      <footer className="mt-10 text-center text-[12px] text-text-3">
        Digital Discovery S.r.l. · Firma online, nessun cartaceo
      </footer>
    </main>
  );
}

function Field({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-text-3">{label}</dt>
      <dd
        className={
          strong
            ? "text-[15px] font-bold text-text"
            : "text-[14px] font-semibold text-text"
        }
      >
        {value}
      </dd>
    </div>
  );
}
