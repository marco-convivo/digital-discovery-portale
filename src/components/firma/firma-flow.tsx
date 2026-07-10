"use client";

import { useState, useTransition } from "react";
import { DocusealForm } from "@docuseal/react";
import { submitDati } from "@/app/firma/[token]/actions";
import type { DatiCliente } from "@/lib/docuseal/contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  token: string;
  initialEmbedSrc?: string;
  prefill?: Partial<DatiCliente>;
};

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

export function FirmaFlow({ token, initialEmbedSrc, prefill }: Props) {
  const [embedSrc, setEmbedSrc] = useState<string | null>(
    initialEmbedSrc ?? null,
  );
  const [dati, setDati] = useState<DatiCliente>({ ...EMPTY, ...prefill });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function set(k: keyof DatiCliente, v: string) {
    setDati((d) => ({ ...d, [k]: v }));
  }

  if (embedSrc) {
    return (
      <div className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
        <DocusealForm
          src={embedSrc}
          withTitle={false}
          withDownloadButton={false}
          onComplete={() => {
            window.location.href = `/firma/${token}/ok`;
          }}
        />
      </div>
    );
  }

  function submit() {
    if (!dati.ragioneSociale.trim()) {
      setError("La ragione sociale è obbligatoria.");
      return;
    }
    setError(null);
    start(async () => {
      const res = await submitDati(token, dati);
      if (res.ok) setEmbedSrc(res.embedSrc);
      else setError(res.error);
    });
  }

  return (
    <div className="rounded-card border border-line/60 bg-card p-6 shadow-card">
      <h2 className="text-[15px] font-bold text-text">Dati del Cliente</h2>
      <p className="mt-0.5 text-sm text-text-2">
        Completa i dati; poi apporrai la firma. I dati dell&apos;ordine sono già
        compilati.
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

        <Button onClick={submit} disabled={pending} className="mt-1 self-start">
          {pending ? "Preparazione…" : "Prosegui alla firma →"}
        </Button>
      </div>
    </div>
  );
}
