"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";

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

// Testo legale (premessa + condizioni generali + particolari + DPA).
// Parte COLLASSATO a poche righe: su mobile evita un muro di testo da scrollare.
export function ContrattoLegale({ serviceKeys }: { serviceKeys: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const particolari = sezioniParticolari(serviceKeys);

  return (
    <div className="rounded-md border border-line bg-card-2/50">
      <div className="relative">
        <div
          className={cn(
            "px-4 py-4 sm:px-5",
            expanded
              ? "max-h-[58vh] overflow-y-auto"
              : "max-h-[7.5rem] overflow-hidden",
          )}
        >
          <h3 className="text-[14px] font-extrabold uppercase tracking-wide text-text">
            Condizioni Generali
          </h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-text-2">
            {PREMESSA_POTERI}
          </p>
          {CONDIZIONI_GENERALI.map((a) => (
            <ArticoloView key={a.id} a={a} />
          ))}

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

          <SezioneView s={DPA} />
        </div>

        {/* Sfumatura in basso quando è collassato */}
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 rounded-b-md bg-gradient-to-t from-card-2 to-transparent" />
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 border-t border-line py-2.5 text-[13px] font-semibold text-violet transition-colors hover:bg-card-2"
      >
        {expanded ? "Comprimi ↑" : "Leggi le condizioni complete ↓"}
      </button>
    </div>
  );
}
