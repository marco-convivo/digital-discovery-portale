"use client";

import { useState, useTransition } from "react";
import {
  createQuote,
  type CreateQuoteInput,
} from "@/app/(app)/vendite/clienti/[id]/actions";
import { CATALOG, type OrdineSelezione, type CatalogService } from "@/lib/catalog";
import { euro } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Tipo = CreateQuoteInput["tipo"];
type Sel = OrdineSelezione[string];

export function CreateQuoteForm({
  clientId,
  prezziBase,
}: {
  clientId: string;
  prezziBase: Record<string, number | null>;
}) {
  const [sel, setSel] = useState<OrdineSelezione>({});
  const [prezzi, setPrezzi] = useState<Record<string, string>>({});
  const [sconto, setSconto] = useState("");
  const [tipo, setTipo] = useState<Tipo>("ricorrente");
  const [rateNum, setRateNum] = useState("");
  const [rateTouched, setRateTouched] = useState(false);
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
    const svc = CATALOG.find((c) => c.key === key);
    patch(key, {
      selected: on,
      // durata di default per i ricorrenti (12 mesi) alla prima selezione
      ...(on && svc?.ricorrente && sel[key]?.durata === undefined
        ? { durata: 12 }
        : {}),
    });
    if (on) {
      setPrezzi((p) =>
        p[key] !== undefined
          ? p
          : { ...p, [key]: prezziBase[key] != null ? String(prezziBase[key]) : "" },
      );
    }
  }
  function toggleChannel(key: string, ch: string) {
    setSel((s) => {
      const cur = s[key]?.channels ?? [];
      const next = cur.includes(ch) ? cur.filter((c) => c !== ch) : [...cur, ch];
      return { ...s, [key]: { ...s[key], channels: next } };
    });
  }

  // --- calcolo economico -----------------------------------------------------
  const prezzoNum = (k: string) => {
    const n = Number(prezzi[k]);
    return Number.isFinite(n) ? n : 0;
  };
  const durataOf = (c: CatalogService) => sel[c.key]?.durata ?? 12;
  // Contributo al TOTALE contratto: ricorrente = prezzo mensile × mesi;
  // una tantum / progetto = prezzo una volta.
  const contributo = (c: CatalogService) =>
    c.ricorrente ? prezzoNum(c.key) * durataOf(c) : prezzoNum(c.key);

  const selectedServices = CATALOG.filter((c) => sel[c.key]?.selected);
  const totaleServizi = selectedServices.reduce((s, c) => s + contributo(c), 0);
  const scontoNum = Math.max(0, Number(sconto) || 0);
  const totaleContratto = Math.max(0, totaleServizi - scontoNum);

  // N. rate: default = durata più lunga tra i servizi ricorrenti; poi editabile.
  const durateRicorrenti = selectedServices
    .filter((c) => c.ricorrente)
    .map(durataOf);
  const mesiContratto = durateRicorrenti.length
    ? Math.max(...durateRicorrenti)
    : 12;
  const rateN = rateTouched
    ? Math.max(1, Math.trunc(Number(rateNum) || 0))
    : mesiContratto;
  const rata = ricorrente && rateN > 0 ? totaleContratto / rateN : 0;

  function submit() {
    setError(null);
    start(async () => {
      const prezziObj = Object.fromEntries(
        selectedServices.map((c) => [c.key, contributo(c)]),
      );
      const res = await createQuote({
        clientId,
        tipo,
        rataMensile: ricorrente ? rata : null,
        rateNum: ricorrente ? rateN : null,
        importoTotale: totaleContratto,
        validoFino: validoFino || null,
        ordine: sel,
        prezzi: prezziObj,
        sconto: scontoNum,
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

                {on && svc.ricorrente && (
                  <div className="mt-2 flex items-center gap-2 pl-6 text-[12px] text-text-2">
                    Durata:
                    {[3, 6, 9, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => patch(svc.key, { durata: m })}
                        className={cn(
                          "rounded-pill px-2 py-0.5 font-semibold",
                          durataOf(svc) === m
                            ? "bg-ink text-on-ink"
                            : "bg-card-2 text-text-2",
                        )}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                )}

                {on && (
                  <div className="mt-2 flex items-center justify-between gap-2 pl-6 text-[12px] text-text-2">
                    <span>Prezzo {svc.ricorrente ? "(€/mese)" : "(€)"}</span>
                    <div className="flex items-center gap-2">
                      {svc.ricorrente && prezzoNum(svc.key) > 0 && (
                        <span className="text-text-3 tnum">
                          × {durataOf(svc)}m = {euro(contributo(svc))}
                        </span>
                      )}
                      <input
                        type="number"
                        value={prezzi[svc.key] ?? ""}
                        onChange={(e) =>
                          setPrezzi((p) => ({ ...p, [svc.key]: e.target.value }))
                        }
                        placeholder={
                          prezziBase[svc.key] != null
                            ? String(prezziBase[svc.key])
                            : "—"
                        }
                        className="w-24 rounded-sm border border-line bg-card px-2 py-1 text-right text-[13px] tnum"
                      />
                    </div>
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

      {/* Riepilogo economico: contributi al totale contratto → rata mensile */}
      {selectedServices.length > 0 && (
        <div className="flex flex-col gap-2.5 rounded-md border border-line bg-card-2/60 p-3.5">
          <div className="flex items-center justify-between text-[13px] text-text-2">
            <span>Subtotale servizi</span>
            <span className="font-semibold text-text tnum">
              {euro(totaleServizi)}
            </span>
          </div>
          <label className="flex items-center justify-between gap-3 text-[13px] text-text-2">
            <span>Sconto (€)</span>
            <input
              type="number"
              value={sconto}
              onChange={(e) => setSconto(e.target.value)}
              placeholder="0"
              className="w-28 rounded-sm border border-line bg-card px-2 py-1 text-right text-[13px] tnum"
            />
          </label>
          {ricorrente && (
            <label className="flex items-center justify-between gap-3 text-[13px] text-text-2">
              <span>N. rate</span>
              <input
                type="number"
                value={rateTouched ? rateNum : String(mesiContratto)}
                onChange={(e) => {
                  setRateTouched(true);
                  setRateNum(e.target.value);
                }}
                className="w-28 rounded-sm border border-line bg-card px-2 py-1 text-right text-[13px] tnum"
              />
            </label>
          )}
          <div className="flex items-baseline justify-between border-t border-line pt-2.5">
            <span className="text-[13px] font-semibold text-text-2">
              Totale contratto
            </span>
            <span className="text-[16px] font-extrabold text-text tnum">
              {euro(totaleContratto)}
            </span>
          </div>
          {ricorrente && (
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-text-3">
                Rata mensile ({rateN} rate)
              </span>
              <span className="text-[13px] font-bold text-text tnum">
                {euro(rata)} /mese
              </span>
            </div>
          )}
        </div>
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
