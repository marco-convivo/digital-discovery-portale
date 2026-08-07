"use client";

import { useState, useTransition } from "react";
import { registraBonifico } from "@/lib/bonifico/actions";

export function BonificoConferma({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  if (ok) {
    return (
      <div className="rounded-md bg-mint-soft p-4 text-[13.5px] text-on-mint">
        <b>Scelta registrata ✓</b>
        <p className="mt-1 text-on-mint/80">
          Effettua il bonifico con i dati qui sopra. Appena riceviamo la contabile
          attiviamo il tuo accesso al portale e ti scriviamo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const res = await registraBonifico(token);
            if (res.ok) setOk(true);
            else setError(res.error);
          });
        }}
        className="rounded-pill bg-ink px-5 py-3 text-[14px] font-semibold text-on-ink transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Registrazione…" : "Ho preso nota, procedo col bonifico"}
      </button>
      {error && (
        <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
          {error}
        </p>
      )}
    </div>
  );
}
