"use client";

import { useState, useTransition } from "react";
import {
  createQuote,
  type CreateQuoteInput,
} from "@/app/(app)/vendite/clienti/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Item = { descrizione: string; prezzo: string };
type Tipo = CreateQuoteInput["tipo"];

export function CreateQuoteForm({ clientId }: { clientId: string }) {
  const [tipo, setTipo] = useState<Tipo>("ricorrente");
  const [rata, setRata] = useState("");
  const [rateNum, setRateNum] = useState("12");
  const [importo, setImporto] = useState("");
  const [validoFino, setValidoFino] = useState("");
  const [items, setItems] = useState<Item[]>([{ descrizione: "", prezzo: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const ricorrente = tipo === "ricorrente";

  function setItem(i: number, patch: Partial<Item>) {
    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function submit() {
    setError(null);
    start(async () => {
      const res = await createQuote({
        clientId,
        tipo,
        rataMensile: ricorrente ? Number(rata) : null,
        rateNum: ricorrente ? Number(rateNum) : null,
        importoTotale: ricorrente ? null : Number(importo),
        validoFino: validoFino || null,
        items: items.map((it) => ({
          descrizione: it.descrizione,
          prezzo: Number(it.prezzo) || 0,
        })),
      });
      if (res.ok) setLink(`${location.origin}/preventivo/${res.token}`);
      else setError(res.error);
    });
  }

  if (link) {
    return (
      <div className="rounded-md bg-mint-soft p-4">
        <p className="font-bold text-on-mint">Preventivo creato ✓</p>
        <p className="mt-1 text-sm text-text-2">Link pubblico da inviare al cliente:</p>
        <div className="mt-2 flex gap-2">
          <input
            readOnly
            value={link}
            className="w-full rounded-sm border border-line bg-card px-2.5 py-1.5 text-[13px] text-text-2"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
            }}
          >
            {copied ? "Copiato" : "Copia"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-text-2">Formula</span>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as Tipo)}
          className="w-full rounded-md border border-line bg-card px-3.5 py-2.5 text-sm text-text focus-visible:outline-2 focus-visible:outline-violet"
        >
          <option value="ricorrente">Ricorrente (rate mensili)</option>
          <option value="una_tantum">Una tantum</option>
          <option value="acconto">Acconto</option>
        </select>
      </label>

      {ricorrente ? (
        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label="Rata mensile (€)"
            type="number"
            value={rata}
            onChange={(e) => setRata(e.target.value)}
            placeholder="349"
          />
          <Input
            label="N. rate"
            type="number"
            value={rateNum}
            onChange={(e) => setRateNum(e.target.value)}
            placeholder="12"
          />
        </div>
      ) : (
        <Input
          label="Importo (€)"
          type="number"
          value={importo}
          onChange={(e) => setImporto(e.target.value)}
          placeholder="1500"
        />
      )}

      <Input
        label="Valido fino al"
        type="date"
        value={validoFino}
        onChange={(e) => setValidoFino(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-text-2">Cosa include</span>
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="Descrizione (es. Ottimizzazione SEO)"
              value={it.descrizione}
              onChange={(e) => setItem(i, { descrizione: e.target.value })}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="€"
              value={it.prezzo}
              onChange={(e) => setItem(i, { prezzo: e.target.value })}
              className="w-24"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((xs) => [...xs, { descrizione: "", prezzo: "" }])}
          className="self-start text-[13px] font-semibold text-violet hover:underline"
        >
          + Aggiungi riga
        </button>
      </div>

      {error && (
        <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
          {error}
        </p>
      )}

      <Button onClick={submit} disabled={pending} className="self-start">
        {pending ? "Creazione…" : "Crea preventivo"}
      </Button>
    </div>
  );
}
