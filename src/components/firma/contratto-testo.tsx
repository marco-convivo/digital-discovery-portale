import { euro } from "@/lib/format";
import { ContrattoLegale } from "@/components/firma/contratto-legale";
import type { Addon } from "@/lib/addon";

export function ContrattoTesto({
  numero,
  importo,
  rata,
  rateNum,
  servizi,
  serviceKeys,
  addons = [],
}: {
  numero: string | null;
  importo: number | null;
  rata: number | null;
  rateNum: number | null;
  servizi: string[];
  serviceKeys: string[];
  addons?: Addon[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Intestazione economica: sempre visibile (dati del Modulo d'Ordine) */}
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

        {addons.length > 0 && (
          <div className="mt-3 border-t border-line pt-2.5">
            <dt className="text-[12px] text-text-3">Servizi aggiuntivi</dt>
            <ul className="mt-1 flex flex-col gap-0.5">
              {addons.map((a, i) => (
                <li key={i} className="text-[12.5px] font-medium text-text-2">
                  {a.descrizione}
                  <span className="font-normal text-text-3">
                    {" "}
                    —{" "}
                    {a.tipo === "ricorrente"
                      ? `${euro(a.prezzo)}/mese · ${a.durata ?? 12} mesi`
                      : `${euro(a.prezzo)} una tantum`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Testo legale: collassato di default, espandibile */}
      <ContrattoLegale serviceKeys={serviceKeys} />
    </div>
  );
}
