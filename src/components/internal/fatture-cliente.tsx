"use client";

import { useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionLink } from "@/components/internal/action-link";
import { caricaFattura, eliminaFattura } from "@/lib/fatture/actions";
import { euro, dataIt } from "@/lib/format";

export interface FatturaRow {
  id: string;
  numero: string | null;
  data: string | null;
  importo: number | null;
  pdf_url: string | null;
}

export function FattureCliente({
  clientId,
  fatture,
}: {
  clientId: string;
  fatture: FatturaRow[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    form.set("clientId", clientId);
    start(async () => {
      const res = await caricaFattura(form);
      if (res.ok) {
        setMsg("Fattura caricata e cliente avvisato via email.");
        formRef.current?.reset();
      } else {
        setError(res.error);
      }
    });
  }

  function rimuovi(id: string) {
    setError(null);
    setMsg(null);
    start(async () => {
      const res = await eliminaFattura(id, clientId);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {fatture.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {fatture.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-text">
                  {f.numero ?? "—"}
                </div>
                <div className="text-[12.5px] text-text-3">{dataIt(f.data)}</div>
              </div>
              <div className="flex flex-none items-center gap-3">
                <span className="font-bold tabular-nums text-text">
                  {euro(f.importo)}
                </span>
                {f.pdf_url && (
                  <ActionLink href={f.pdf_url} label="PDF" icon="pdf" />
                )}
                <button
                  type="button"
                  onClick={() => rimuovi(f.id)}
                  disabled={pending}
                  className="text-[12.5px] font-semibold text-text-3 transition-colors hover:text-fail-tx disabled:opacity-50"
                >
                  Elimina
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-md bg-card-2 p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="numero"
            label="Numero fattura"
            placeholder="es. 2026/128"
            required
          />
          <Input name="data" label="Data" type="date" required />
        </div>
        <Input
          name="importo"
          label="Importo (€, IVA inclusa)"
          type="number"
          step="0.01"
          min="0"
          placeholder="es. 122.00"
          required
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text-2">
            PDF della fattura<span className="text-fail-tx"> *</span>
          </span>
          <input
            name="file"
            type="file"
            accept="application/pdf"
            required
            className="w-full rounded-md border border-line bg-card px-3.5 py-2.5 text-sm text-text file:mr-3 file:rounded-pill file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-[13px] file:font-semibold file:text-on-ink"
          />
        </label>

        {error && (
          <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
            {error}
          </p>
        )}
        {msg && (
          <p className="rounded-sm bg-mint-soft px-3 py-2 text-[13px] text-on-mint">
            {msg}
          </p>
        )}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Caricamento…" : "Carica fattura"}
        </Button>
      </form>
    </div>
  );
}
