"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dichiaraBonifico } from "@/lib/portale/actions";
import { euro, conIva } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { InsolutiClienteData, InsolutoCliente } from "@/lib/portale/insoluti";

function Riga({
  r,
  maggiorazione,
  iban,
  causale,
}: {
  r: InsolutoCliente;
  maggiorazione: number;
  iban: string | null;
  causale: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [bonifico, setBonifico] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const netto = Number(r.importo ?? 0) + maggiorazione;
  const inVerifica = r.recovery_stato === "bonifico_in_verifica";

  function confermaBonifico() {
    setError(null);
    start(async () => {
      const res = await dichiaraBonifico(r.id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="rounded-card border border-wait-tx/25 bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-text">
            Rata {r.numero_rata ?? "—"} da saldare
          </p>
          <p className="mt-0.5 text-[13px] text-text-2">
            L&apos;addebito non è andato a buon fine. Puoi saldarla qui.
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-text tnum">
            {euro(conIva(netto))}
          </div>
          <div className="text-[11px] text-text-3">
            rata {euro(Number(r.importo ?? 0))} + insoluto {euro(maggiorazione)} ·
            IVA inclusa
          </div>
        </div>
      </div>

      {inVerifica ? (
        <div className="mt-4 rounded-md bg-info-bg px-4 py-3 text-[13px] text-info-tx">
          Abbiamo ricevuto la tua conferma di <b>bonifico</b>. Appena lo
          verifichiamo, la rata risulterà saldata.
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <a
              href={`/recupero/${r.recovery_token}`}
              className="rounded-pill bg-ink px-5 py-2.5 text-[14px] font-bold text-on-ink transition-colors hover:bg-ink/90"
            >
              Paga con carta
            </a>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => setBonifico((v) => !v)}
            >
              Ho pagato con bonifico
            </Button>
          </div>

          {bonifico && (
            <div className="mt-3 rounded-md border border-line bg-card-2/60 p-4 text-[13px] text-text-2">
              <p className="font-semibold text-text">Paga con bonifico</p>
              <p className="mt-1.5">
                IBAN: <b>{iban ?? "— (contattaci per l'IBAN)"}</b>
                <br />
                Causale: {causale ?? "Saldo insoluto"} · rata {r.numero_rata ?? ""}
                <br />
                Importo: <b>{euro(conIva(netto))}</b>
              </p>
              <Button
                className="mt-3"
                disabled={pending || !iban}
                onClick={confermaBonifico}
              >
                {pending ? "Invio…" : "Ho effettuato il bonifico"}
              </Button>
              {!iban && (
                <p className="mt-2 text-[12px] text-fail-tx">
                  IBAN non ancora disponibile: contattaci per completare il
                  bonifico.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {error && (
        <p className="mt-2 rounded-sm bg-fail-bg px-3 py-1.5 text-[12.5px] text-fail-tx">
          {error}
        </p>
      )}
    </div>
  );
}

export function InsolutoClienteBanner({ data }: { data: InsolutiClienteData }) {
  if (data.insoluti.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-full bg-wait-bg text-[13px] text-wait-tx">
          !
        </span>
        <h2 className="text-[15px] font-bold text-text">Rate da saldare</h2>
      </div>
      {data.insoluti.map((r) => (
        <Riga
          key={r.id}
          r={r}
          maggiorazione={data.maggiorazione}
          iban={data.iban}
          causale={data.causale}
        />
      ))}
    </section>
  );
}
