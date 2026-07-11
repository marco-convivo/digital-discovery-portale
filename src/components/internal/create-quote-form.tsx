"use client";

import { useState, useTransition } from "react";
import {
  createQuote,
  type CreateQuoteInput,
} from "@/app/(app)/vendite/clienti/[id]/actions";
import { CATALOG, type OrdineSelezione } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Tipo = CreateQuoteInput["tipo"];
type Sel = OrdineSelezione[string];

export function CreateQuoteForm({ clientId }: { clientId: string }) {
  const [sel, setSel] = useState<OrdineSelezione>({});
  const [tipo, setTipo] = useState<Tipo>("ricorrente");
  const [rata, setRata] = useState("");
  const [rateNum, setRateNum] = useState("12");
  const [importo, setImporto] = useState("");
  const [validoFino, setValidoFino] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const ricorrente = tipo === "ricorrente";

  function patch(key: string, p: Partial<Sel>) {
    setSel((s) => ({ ...s, [key]: { ...s[key], ...p } }));
  }
  function toggleService(key: string, on: boolean) {
    patch(key, { selected: on });
  }
  function toggleChannel(key: string, ch: string) {
    setSel((s) => {
      const cur = s[key]?.channels ?? [];
      const next = cur.includes(ch) ? cur.filter((c) => c !== ch) : [...cur, ch];
      return { ...s, [key]: { ...s[key], channels: next } };
    });
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
        ordine: sel,
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
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-[13px] font-semibold text-text-2">Servizi</span>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CATALOG.map((svc) => {
          const s = sel[svc.key];
          const on = !!s?.selected;
          return (
            <div
              key={svc.key}
              className={cn(
                "rounded-md border p-2.5 transition-colors",
                on ? "border-violet bg-violet-soft/40" : "border-line",
              )}
            >
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => toggleService(svc.key, e.target.checked)}
                  className="size-4 accent-ink"
                />
                <span className="text-[14px] font-semibold text-text">
                  {svc.label}
                </span>
                {svc.ricorrente && (
                  <span className="text-[11px] text-text-3">ricorrente</span>
                )}
              </label>

              {on && svc.option && (
                <div className="mt-2 pl-6">
                  {svc.option.kind === "channels" && (
                    <div className="flex flex-wrap gap-1.5">
                      {svc.option.choices!.map((c) => {
                        const active = s?.channels?.includes(c.value);
                        return (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => toggleChannel(svc.key, c.value)}
                            className={cn(
                              "rounded-pill px-2.5 py-1 text-[12px] font-semibold",
                              active
                                ? "bg-ink text-on-ink"
                                : "bg-card-2 text-text-2",
                            )}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {svc.option.kind === "sito_tipo" && (
                    <div className="flex gap-1.5">
                      {svc.option.choices!.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => patch(svc.key, { tipo: c.value })}
                          className={cn(
                            "rounded-pill px-2.5 py-1 text-[12px] font-semibold",
                            s?.tipo === c.value
                              ? "bg-ink text-on-ink"
                              : "bg-card-2 text-text-2",
                          )}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {svc.key === "social" && (
                    <div className="mt-2 flex items-center gap-2 text-[12px] text-text-2">
                      Durata:
                      {[3, 6, 12].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => patch(svc.key, { durata: m })}
                          className={cn(
                            "rounded-pill px-2 py-0.5 font-semibold",
                            s?.durata === m
                              ? "bg-ink text-on-ink"
                              : "bg-card-2 text-text-2",
                          )}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  )}
                  {svc.option.kind === "quantita" && (
                    <input
                      type="number"
                      placeholder="N. reel"
                      value={s?.quantita ?? ""}
                      onChange={(e) =>
                        patch(svc.key, { quantita: Number(e.target.value) })
                      }
                      className="w-24 rounded-sm border border-line bg-card px-2 py-1 text-[13px]"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

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
