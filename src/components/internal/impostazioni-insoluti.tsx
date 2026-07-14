"use client";

import { useState, useTransition } from "react";
import { updateAppSettings } from "@/lib/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppSettings } from "@/lib/settings/app-settings";

export function ImpostazioniInsoluti({ initial }: { initial: AppSettings }) {
  const [open, setOpen] = useState(false);
  const [magg, setMagg] = useState(String(initial.maggiorazione_insoluto ?? 0));
  const [iban, setIban] = useState(initial.iban_bonifico ?? "");
  const [causale, setCausale] = useState(initial.causale_bonifico ?? "");
  const [descr, setDescr] = useState(initial.statement_descriptor ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updateAppSettings({
        maggiorazione_insoluto: Number(magg) || 0,
        iban_bonifico: iban,
        causale_bonifico: causale,
        statement_descriptor: descr,
      });
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[13px] font-semibold text-violet hover:underline"
      >
        Impostazioni recupero (maggiorazione {euroLabel(initial.maggiorazione_insoluto)}, bonifico) →
      </button>
    );
  }

  return (
    <div className="rounded-card border border-line/60 bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-text">Impostazioni recupero</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] font-semibold text-text-3 hover:text-text"
        >
          Chiudi
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Maggiorazione insoluto (€, netto)"
          type="number"
          value={magg}
          onChange={(e) => setMagg(e.target.value)}
        />
        <Input
          label="Descrittore in estratto conto"
          value={descr}
          onChange={(e) => setDescr(e.target.value)}
        />
        <Input
          label="IBAN per bonifico"
          value={iban}
          onChange={(e) => setIban(e.target.value)}
        />
        <Input
          label="Causale bonifico"
          value={causale}
          onChange={(e) => setCausale(e.target.value)}
        />
      </div>
      {error && (
        <p className="mt-3 rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-3 rounded-sm bg-mint-soft px-3 py-2 text-[13px] text-text">
          Salvato.
        </p>
      )}
      <Button size="sm" className="mt-3" onClick={save} disabled={pending}>
        {pending ? "Salvataggio…" : "Salva"}
      </Button>
    </div>
  );
}

function euroLabel(n: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(n ?? 0));
}
