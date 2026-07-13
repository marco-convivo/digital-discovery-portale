"use client";

import { useState, useTransition } from "react";
import { firma } from "@/app/firma/[token]/actions";
import type { DatiCliente, ContrattoHeader } from "@/lib/docuseal/contract";
import { ContrattoTesto } from "@/components/firma/contratto-testo";
import { SignaturePad } from "@/components/firma/signature-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VESSATORIE_INTRO, vessatoriePerServizi } from "@/lib/contratto/testo";

const EMPTY: DatiCliente = {
  ragioneSociale: "",
  sdi: "",
  indirizzo: "",
  pivaCf: "",
  rappresentante: "",
  rappresentanteCf: "",
  rappresentanteIndirizzo: "",
  pec: "",
  email: "",
};

export function FirmaFlow({
  token,
  prefill,
  contratto,
}: {
  token: string;
  prefill?: Partial<DatiCliente>;
  contratto: ContrattoHeader;
}) {
  const [phase, setPhase] = useState<"form" | "sign">("form");
  const [dati, setDati] = useState<DatiCliente>({ ...EMPTY, ...prefill });
  const [signature, setSignature] = useState<string | null>(null);
  const [consenso, setConsenso] = useState(false);
  const [consensoVess, setConsensoVess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const vessatorie = vessatoriePerServizi(contratto.serviceKeys);

  function set(k: keyof DatiCliente, v: string) {
    setDati((d) => ({ ...d, [k]: v }));
  }

  function toSign() {
    if (!dati.ragioneSociale.trim())
      return setError("La ragione sociale è obbligatoria.");
    setError(null);
    setPhase("sign");
  }

  function submit() {
    if (!signature) return setError("Apponi la firma per proseguire.");
    if (!consenso) return setError("Spunta l'accettazione del contratto.");
    if (!consensoVess)
      return setError("Approva specificamente le clausole ex artt. 1341/1342 c.c.");
    setError(null);
    start(async () => {
      const res = await firma(token, dati, signature, consensoVess);
      if (res.ok) window.location.href = `/firma/${token}/ok`;
      else setError(res.error);
    });
  }

  if (phase === "sign") {
    return (
      <div className="flex flex-col gap-5">
        {/* Il contratto, leggibile */}
        <div>
          <h2 className="mb-2 text-[15px] font-bold text-text">Il contratto</h2>
          <p className="mb-3 text-sm text-text-2">
            Leggi le condizioni prima di firmare. Sono riportate le Condizioni
            Generali, le Condizioni Particolari dei servizi in ordine e l&apos;Accordo
            DPA.
          </p>
          <ContrattoTesto
            numero={contratto.numero}
            importo={contratto.importo}
            rata={contratto.rata}
            rateNum={contratto.rateNum}
            servizi={contratto.servizi}
            serviceKeys={contratto.serviceKeys}
          />
        </div>

        <div className="rounded-card border border-line/60 bg-card p-6 shadow-card">
          <h2 className="text-[15px] font-bold text-text">Firma</h2>
          <p className="mt-0.5 text-sm text-text-2">
            Firma nel riquadro qui sotto per concludere.
          </p>
          <div className="mt-4">
            <SignaturePad onChange={setSignature} />
          </div>

          <label className="mt-4 flex items-start gap-2.5 text-[13px] text-text-2">
            <input
              type="checkbox"
              checked={consenso}
              onChange={(e) => setConsenso(e.target.checked)}
              className="mt-0.5 size-4 flex-none accent-ink"
            />
            <span>
              Dichiaro di aver letto e di accettare il contratto e le condizioni
              generali e particolari sopra riportate.
            </span>
          </label>

          {/* Approvazione specifica clausole vessatorie (artt. 1341/1342 c.c.) */}
          <div className="mt-4 rounded-md border border-line bg-card-2/50 p-3.5">
            <label className="flex items-start gap-2.5 text-[13px] text-text-2">
              <input
                type="checkbox"
                checked={consensoVess}
                onChange={(e) => setConsensoVess(e.target.checked)}
                className="mt-0.5 size-4 flex-none accent-ink"
              />
              <span className="font-semibold text-text">{VESSATORIE_INTRO}</span>
            </label>
            <div className="mt-2.5 flex flex-col gap-2.5 pl-6">
              {vessatorie.map((b, i) => (
                <div key={i}>
                  <div className="text-[12px] font-bold uppercase tracking-wide text-text-3">
                    {b.titolo}
                  </div>
                  <ul className="mt-1 flex flex-col gap-1">
                    {b.voci.map((v, j) => (
                      <li key={j} className="text-[12px] leading-relaxed text-text-2">
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-between gap-2.5">
            <Button variant="ghost" onClick={() => setPhase("form")} disabled={pending}>
              ← Indietro
            </Button>
            <Button
              onClick={submit}
              disabled={pending || !signature || !consenso || !consensoVess}
            >
              {pending ? "Firma in corso…" : "Firma e concludi"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line/60 bg-card p-6 shadow-card">
      <h2 className="text-[15px] font-bold text-text">Dati del Cliente</h2>
      <p className="mt-0.5 text-sm text-text-2">
        Completa i dati; poi leggerai il contratto e apporrai la firma. I dati
        dell&apos;ordine sono già compilati.
      </p>

      <div className="mt-5 flex flex-col gap-3.5">
        <Input
          label="Ragione sociale"
          value={dati.ragioneSociale}
          onChange={(e) => set("ragioneSociale", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label="Codice univoco (SDI)"
            value={dati.sdi}
            onChange={(e) => set("sdi", e.target.value)}
          />
          <Input
            label="Partita IVA / Codice Fiscale"
            value={dati.pivaCf}
            onChange={(e) => set("pivaCf", e.target.value)}
          />
        </div>
        <Input
          label="Indirizzo, città, provincia"
          value={dati.indirizzo}
          onChange={(e) => set("indirizzo", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label="Rappresentante legale"
            value={dati.rappresentante}
            onChange={(e) => set("rappresentante", e.target.value)}
          />
          <Input
            label="C.F. rappresentante"
            value={dati.rappresentanteCf}
            onChange={(e) => set("rappresentanteCf", e.target.value)}
          />
        </div>
        <Input
          label="Indirizzo rappresentante"
          value={dati.rappresentanteIndirizzo}
          onChange={(e) => set("rappresentanteIndirizzo", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label="PEC"
            value={dati.pec}
            onChange={(e) => set("pec", e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={dati.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
            {error}
          </p>
        )}

        <Button onClick={toSign} className="mt-1 self-start">
          Prosegui: leggi il contratto e firma →
        </Button>
      </div>
    </div>
  );
}
