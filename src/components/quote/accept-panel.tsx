"use client";

import { useState, useTransition } from "react";
import { accept } from "@/app/preventivo/[token]/actions";
import { Button } from "@/components/ui/button";

// CTA di accettazione. In FASE 2 avanza a "preventivo_accettato"; il passo
// successivo (firma contratto DocuSeal) arriverà dopo.
export function AcceptPanel({
  token,
  alreadyAccepted,
}: {
  token: string;
  alreadyAccepted: boolean;
}) {
  const [done, setDone] = useState(alreadyAccepted);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <div className="rounded-md bg-mint-soft p-4 text-center">
        <p className="font-bold text-on-mint">Preventivo accettato ✓</p>
        <p className="mt-1 text-sm text-text-2">
          Ultimo passaggio: firma il contratto online, poi imposti il pagamento.
        </p>
        <a
          href={`/firma/${token}`}
          className="mt-4 inline-flex rounded-pill bg-ink px-5 py-2.5 text-[13.5px] font-bold text-on-ink hover:bg-ink/90"
        >
          Firma il contratto →
        </a>
      </div>
    );
  }

  function onAccept() {
    start(async () => {
      const res = await accept(token);
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  return (
    <div className="text-center">
      <p className="text-[15px] font-bold text-text">Pronti a partire?</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-text-2">
        Accettando, si passa alla firma del contratto e all&apos;impostazione del
        pagamento. Bastano un paio di minuti.
      </p>
      {error && (
        <p className="mt-3 rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
          {error}
        </p>
      )}
      <Button onClick={onAccept} disabled={pending} className="mt-4">
        {pending ? "Un attimo…" : "Accetta e procedi alla firma"}
      </Button>
    </div>
  );
}
