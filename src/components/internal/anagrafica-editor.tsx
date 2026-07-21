"use client";

import { useState, useTransition } from "react";
import {
  updateCliente,
  type AnagraficaInput,
} from "@/app/(app)/vendite/clienti/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FIELDS: { key: keyof AnagraficaInput; label: string; wide?: boolean }[] = [
  { key: "ragione_sociale", label: "Ragione sociale", wide: true },
  { key: "referente", label: "Referente" },
  { key: "email", label: "Email" },
  { key: "telefono", label: "Telefono" },
  { key: "p_iva", label: "P. IVA" },
  { key: "codice_fiscale", label: "Cod. fiscale" },
  { key: "codice_sdi", label: "Codice SDI" },
  { key: "pec", label: "PEC" },
  { key: "indirizzo", label: "Indirizzo", wide: true },
];

export function AnagraficaEditor({
  clientId,
  initial,
}: {
  clientId: string;
  initial: AnagraficaInput;
}) {
  const [data, setData] = useState<AnagraficaInput>(initial);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AnagraficaInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function open() {
    setDraft(data);
    setError(null);
    setEditing(true);
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await updateCliente(clientId, draft);
      if (res.ok) {
        setData(draft);
        setEditing(false);
      } else setError(res.error);
    });
  }

  if (!editing) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-text">Anagrafica</h3>
          <button
            onClick={open}
            className="text-[13px] font-semibold text-violet hover:underline"
          >
            Modifica
          </button>
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
          {FIELDS.filter((f) => f.key !== "ragione_sociale").map((f) => (
            <div key={f.key} className="flex min-w-0 justify-between gap-3">
              <dt className="flex-none text-text-3">{f.label}</dt>
              <dd className="truncate text-right font-medium text-text">
                {data[f.key] || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-[15px] font-bold text-text">Modifica anagrafica</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={cn(f.wide && "sm:col-span-2")}>
            <Input
              label={f.label}
              value={draft[f.key] ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, [f.key]: e.target.value }))
              }
            />
          </div>
        ))}
      </div>
      {error && (
        <p className="mt-3 rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvataggio…" : "Salva"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setEditing(false)}
          disabled={pending}
        >
          Annulla
        </Button>
      </div>
    </div>
  );
}
