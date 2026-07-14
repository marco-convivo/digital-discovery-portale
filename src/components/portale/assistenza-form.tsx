"use client";

import { useState, useTransition } from "react";
import { inviaRichiestaAssistenza } from "@/lib/portale/assistenza";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AssistenzaForm() {
  const [oggetto, setOggetto] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  function invia(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await inviaRichiestaAssistenza({ oggetto, messaggio });
      if (res.ok) setSent(true);
      else setError(res.error);
    });
  }

  if (sent) {
    return (
      <div className="rounded-card bg-mint-soft p-6 text-center">
        <div className="mb-1 text-3xl">✓</div>
        <p className="font-bold text-on-mint">Richiesta inviata</p>
        <p className="mt-1 text-sm text-text-2">
          Ti risponderemo al più presto all&apos;email del tuo account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={invia} className="flex flex-col gap-4">
      <Input
        label="Oggetto"
        required
        placeholder="Es. Modifica al piano editoriale"
        value={oggetto}
        onChange={(e) => setOggetto(e.target.value)}
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text-2">
          Messaggio<span className="text-fail-tx"> *</span>
        </span>
        <textarea
          required
          rows={6}
          placeholder="Raccontaci come possiamo aiutarti…"
          value={messaggio}
          onChange={(e) => setMessaggio(e.target.value)}
          className="w-full rounded-md border border-line bg-card px-3.5 py-2.5 text-sm text-text placeholder:text-text-3 outline-none focus:border-violet"
        />
      </label>
      {error && (
        <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Invio…" : "Invia richiesta"}
      </Button>
    </form>
  );
}
