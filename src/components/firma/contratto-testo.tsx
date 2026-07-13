import { euro } from "@/lib/format";
import {
  PREMESSA_POTERI,
  CONDIZIONI_GENERALI,
  PARTICOLARI,
  PARTICOLARI_INTRO,
  DPA,
  sezioniParticolari,
  type Articolo,
  type Sezione,
} from "@/lib/contratto/testo";

function ArticoloView({ a }: { a: Articolo }) {
  return (
    <div className="mt-3">
      <h4 className="text-[13.5px] font-bold text-text">
        {a.id} — {a.titolo}
      </h4>
      <div className="mt-1 flex flex-col gap-1.5">
        {a.commi.map((c, i) => (
          <p key={i} className="text-[12.5px] leading-relaxed text-text-2">
            {c}
          </p>
        ))}
      </div>
    </div>
  );
}

function SezioneView({ s }: { s: Sezione }) {
  return (
    <section className="mt-5 border-t border-line pt-4">
      <h3 className="text-[14px] font-extrabold uppercase tracking-wide text-text">
        {s.titolo}
      </h3>
      {s.articoli.map((a) => (
        <ArticoloView key={a.id} a={a} />
      ))}
    </section>
  );
}

export function ContrattoTesto({
  numero,
  importo,
  rata,
  rateNum,
  servizi,
  serviceKeys,
}: {
  numero: string | null;
  importo: number | null;
  rata: number | null;
  rateNum: number | null;
  servizi: string[];
  serviceKeys: string[];
}) {
  const particolari = sezioniParticolari(serviceKeys);
  return (
    <div className="rounded-md border border-line bg-card-2/50">
      <div className="max-h-[58vh] overflow-y-auto px-4 py-4 sm:px-5">
        {/* Intestazione: dati economici del Modulo d'Ordine */}
        <div className="rounded-md border border-line bg-card p-4">
          <h3 className="text-[14px] font-extrabold text-text">
            Modulo d&apos;Ordine {numero ? `n. ${numero}` : ""}
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px] sm:grid-cols-4">
            <div>
              <dt className="text-text-3">Importo</dt>
              <dd className="font-bold text-text tnum">{euro(importo)}</dd>
            </div>
            {rata != null && (
              <div>
                <dt className="text-text-3">Rata mensile</dt>
                <dd className="font-bold text-text tnum">{euro(rata)}</dd>
              </div>
            )}
            {rateNum != null && (
              <div>
                <dt className="text-text-3">N. rate</dt>
                <dd className="font-bold text-text tnum">{rateNum}</dd>
              </div>
            )}
          </dl>
          {servizi.length > 0 && (
            <div className="mt-3 border-t border-line pt-2.5">
              <dt className="text-[12px] text-text-3">Servizi</dt>
              <ul className="mt-1 flex flex-col gap-0.5">
                {servizi.map((s, i) => (
                  <li key={i} className="text-[12.5px] font-medium text-text-2">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Premessa poteri di rappresentanza */}
        <p className="mt-4 text-[12.5px] leading-relaxed text-text-2">
          {PREMESSA_POTERI}
        </p>

        {/* Condizioni Generali */}
        <section className="mt-5 border-t border-line pt-4">
          <h3 className="text-[14px] font-extrabold uppercase tracking-wide text-text">
            Condizioni Generali
          </h3>
          {CONDIZIONI_GENERALI.map((a) => (
            <ArticoloView key={a.id} a={a} />
          ))}
        </section>

        {/* Condizioni Particolari — solo i servizi in ordine */}
        {particolari.length > 0 && (
          <>
            <p className="mt-5 border-t border-line pt-4 text-[12px] italic leading-relaxed text-text-3">
              {PARTICOLARI_INTRO}
            </p>
            {particolari.map((p) => (
              <SezioneView key={p} s={PARTICOLARI[p]} />
            ))}
          </>
        )}

        {/* DPA — sempre */}
        <SezioneView s={DPA} />
      </div>
    </div>
  );
}
