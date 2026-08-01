"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registraMandatoSepa } from "@/lib/sepa/actions";
import { SEPA_CREDITORE, SEPA_MANDATO_TESTO } from "@/lib/sepa/config";

interface Props {
  token: string;
  ragioneSociale: string;
  defaults: {
    intestatario: string;
    indirizzo: string;
    email: string;
  };
}

export function MandatoSepaForm({ token, ragioneSociale, defaults }: Props) {
  const [intestatario, setIntestatario] = useState(defaults.intestatario);
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [indirizzo, setIndirizzo] = useState(defaults.indirizzo);
  const [email, setEmail] = useState(defaults.email);
  const [consenso, setConsenso] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await registraMandatoSepa(token, {
      intestatario,
      iban,
      bic,
      indirizzo,
      email,
      consenso,
    });
    if (res.ok) setDone(true);
    else {
      setError(res.error);
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-card border border-line/60 bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-paid-bg text-paid-tx">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </div>
        <h1 className="text-lg font-extrabold tracking-[-0.01em] text-text">
          Mandato registrato
        </h1>
        <p className="mt-2 text-sm text-text-2">
          Grazie. Abbiamo ricevuto la tua autorizzazione all&apos;addebito SEPA:
          attiveremo l&apos;addebito e troverai il piano nella tua area riservata.
        </p>
        <a
          href="/accedi"
          className="mt-5 inline-block rounded-pill bg-ink px-5 py-2.5 text-[14px] font-semibold text-on-ink transition-opacity hover:opacity-90"
        >
          Accedi al tuo portale
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-card border border-line/60 bg-card p-6 shadow-card"
    >
      <h1 className="text-lg font-extrabold tracking-[-0.01em] text-text">
        Mandato di addebito SEPA
      </h1>
      <p className="mt-0.5 text-sm text-text-2">
        Autorizzi l&apos;addebito diretto sul tuo conto per {ragioneSociale}.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <Input
          label="Intestatario del conto"
          required
          value={intestatario}
          onChange={(e) => setIntestatario(e.target.value)}
        />
        <Input
          label="IBAN"
          required
          placeholder="IT60 X054 2811 1010 0000 0123 456"
          value={iban}
          onChange={(e) => setIban(e.target.value)}
        />
        <Input
          label="BIC / SWIFT (facoltativo)"
          value={bic}
          onChange={(e) => setBic(e.target.value)}
        />
        <Input
          label="Indirizzo"
          value={indirizzo}
          onChange={(e) => setIndirizzo(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="mt-5 rounded-md bg-card-2 p-4 text-[12.5px] leading-relaxed text-text-2">
        <div className="font-bold text-text">Creditore</div>
        <div>{SEPA_CREDITORE.nome}</div>
        <div>{SEPA_CREDITORE.indirizzo}</div>
        <div>
          Codice identificativo (CID):{" "}
          <span className="font-semibold text-text">
            {SEPA_CREDITORE.creditorId}
          </span>
        </div>
        <p className="mt-3 border-t border-line pt-3">{SEPA_MANDATO_TESTO}</p>
      </div>

      <label className="mt-4 flex items-start gap-2.5 text-[13px] text-text-2">
        <input
          type="checkbox"
          checked={consenso}
          onChange={(e) => setConsenso(e.target.checked)}
          className="mt-0.5 size-4 flex-none"
        />
        <span>
          Ho letto e accetto il mandato: autorizzo {SEPA_CREDITORE.nome} e la mia
          banca ad addebitare il conto indicato secondo le condizioni sopra.
        </span>
      </label>

      {error && (
        <p className="mt-3 rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending || !consenso}
        className="mt-5 w-full"
      >
        {pending ? "Registrazione…" : "Accetta e attiva l'addebito"}
      </Button>

      <p className="mt-4 text-[12px] leading-relaxed text-text-3">
        Il tuo IBAN è usato solo per l&apos;addebito autorizzato ed è conservato
        in modo sicuro. Gli addebiti seguono le date del piano concordato.
      </p>
    </form>
  );
}
