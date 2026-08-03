"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createQuote, type CreateQuoteInput } from "@/app/(app)/vendite/clienti/[id]/actions";
import { CATALOG, type OrdineSelezione, type CatalogService } from "@/lib/catalog";
import { addonContributo, type Addon } from "@/lib/addon";
import type { ServizioExtra } from "@/lib/catalogo/queries";
import { euro, conIva, dataIt } from "@/lib/format";
import { generaRate } from "@/lib/preventivi/genera-rate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { MoneyBlock, MoneyAmount, MoneyRow } from "@/components/ui/money-block";
import { PreflightList, type PreflightItem } from "@/components/ui/preflight-list";
import { cn } from "@/lib/utils";

type Tipo = CreateQuoteInput["tipo"];
type Sel = OrdineSelezione[string];

export function PreventivoEditor({
  clientId,
  clientNome,
  clientReferente,
  clientEmail,
  prezziBase,
  serviziExtra = [],
}: {
  clientId: string;
  clientNome: string;
  clientReferente: string | null;
  clientEmail: string | null;
  prezziBase: Record<string, number | null>;
  serviziExtra?: ServizioExtra[];
}) {
  const [sel, setSel] = useState<OrdineSelezione>({});
  const [prezzi, setPrezzi] = useState<Record<string, string>>({});
  const [sconto, setSconto] = useState("");
  const [motivoSconto, setMotivoSconto] = useState("");
  const [tipo, setTipo] = useState<Tipo>("ricorrente");
  const [rateNum, setRateNum] = useState("");
  const [rateTouched, setRateTouched] = useState(false);
  const [validoFino, setValidoFino] = useState("");
  const [dataPrimaRata, setDataPrimaRata] = useState("");
  const [addons, setAddons] = useState<Addon[]>([]);
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
      ...(on && svc?.ricorrente && sel[key]?.durata === undefined
        ? { durata: 12 }
        : {}),
    });
    if (on)
      setPrezzi((p) =>
        p[key] !== undefined
          ? p
          : { ...p, [key]: prezziBase[key] != null ? String(prezziBase[key]) : "" },
      );
  }
  function toggleChannel(key: string, ch: string) {
    setSel((s) => {
      const cur = s[key]?.channels ?? [];
      const next = cur.includes(ch) ? cur.filter((c) => c !== ch) : [...cur, ch];
      return { ...s, [key]: { ...s[key], channels: next } };
    });
  }

  // --- calcolo economico (stesso motore del vecchio form) --------------------
  const prezzoNum = (k: string) => {
    const n = Number(prezzi[k]);
    return Number.isFinite(n) ? n : 0;
  };
  const durataOf = (c: CatalogService) => sel[c.key]?.durata ?? 12;
  const contributo = (c: CatalogService) =>
    c.ricorrente ? prezzoNum(c.key) * durataOf(c) : prezzoNum(c.key);

  const selectedServices = CATALOG.filter((c) => sel[c.key]?.selected);
  const totaleAddon = addons.reduce((s, a) => s + addonContributo(a), 0);
  const totaleServizi =
    selectedServices.reduce((s, c) => s + contributo(c), 0) + totaleAddon;
  const scontoNum = Math.max(0, Number(sconto) || 0);
  const totaleContratto = Math.max(0, totaleServizi - scontoNum);

  // Una tantum vs ricorrente: due impegni distinti (solo display).
  const totaleUnaTantum =
    selectedServices.filter((c) => !c.ricorrente).reduce((s, c) => s + prezzoNum(c.key), 0) +
    addons.filter((a) => a.tipo === "una_tantum").reduce((s, a) => s + a.prezzo, 0);
  const totaleRicorrenteMensile =
    selectedServices.filter((c) => c.ricorrente).reduce((s, c) => s + prezzoNum(c.key), 0) +
    addons.filter((a) => a.tipo === "ricorrente").reduce((s, a) => s + a.prezzo, 0);

  const durate = [
    ...selectedServices.filter((c) => c.ricorrente).map(durataOf),
    ...addons.filter((a) => a.tipo === "ricorrente").map((a) => a.durata ?? 12),
  ];
  const mesiContratto = durate.length ? Math.max(...durate) : 12;
  const rateN = rateTouched
    ? Math.max(1, Math.trunc(Number(rateNum) || 0))
    : mesiContratto;
  const rata = ricorrente && rateN > 0 ? totaleContratto / rateN : 0;

  // Anteprima scadenze: STESSA funzione del piano rate reale (genera-rate).
  const scadenze = useMemo(
    () =>
      totaleContratto > 0
        ? generaRate({
            tipo,
            importoTotale: totaleContratto,
            rataMensile: rata,
            rateNum: rateN,
            primaScadenza: dataPrimaRata || null,
          })
        : [],
    [tipo, totaleContratto, rata, rateN, dataPrimaRata],
  );
  const primoIncassoNetto = scadenze[0]?.importo ?? 0;

  // --- checklist "Prima di inviare" ------------------------------------------
  const nessunaVoce = selectedServices.length === 0 && addons.length === 0;
  const blocchi: string[] = [];
  if (nessunaVoce) blocchi.push("Aggiungi almeno un servizio o un addon.");
  if (totaleContratto <= 0) blocchi.push("Il totale del preventivo deve essere maggiore di zero.");
  const preflight: PreflightItem[] = [
    {
      stato: nessunaVoce ? "blocco" : "ok",
      label: nessunaVoce ? "Aggiungi almeno una voce" : "Almeno una voce inclusa",
    },
    {
      stato: totaleContratto > 0 ? "ok" : "blocco",
      label: totaleContratto > 0 ? "Totale impostato" : "Imposta un importo",
    },
    {
      stato: validoFino ? "ok" : "avviso",
      label: validoFino ? "Validità impostata" : "Manca la data di validità",
    },
    ...(scontoNum > 0
      ? [
          {
            stato: motivoSconto.trim() ? ("ok" as const) : ("avviso" as const),
            label: motivoSconto.trim()
              ? "Sconto motivato"
              : "Sconto senza motivazione (verrà mostrata al cliente)",
          },
        ]
      : []),
    {
      stato: clientEmail ? "ok" : "avviso",
      label: clientEmail
        ? "Il cliente ha un'email per l'accesso al portale"
        : "Il cliente non ha un'email: l'accesso al portale non partirà",
    },
  ];

  function payload(): CreateQuoteInput {
    const prezziObj = Object.fromEntries(
      selectedServices.map((c) => [c.key, prezzoNum(c.key)]),
    );
    return {
      clientId,
      tipo,
      rataMensile: ricorrente ? rata : null,
      rateNum: ricorrente ? rateN : null,
      importoTotale: totaleContratto,
      validoFino: validoFino || null,
      dataPrimaRata: dataPrimaRata || null,
      ordine: sel,
      prezzi: prezziObj,
      sconto: scontoNum,
      motivoSconto: motivoSconto || null,
      addons,
    };
  }

  function invia(apri: boolean) {
    setError(null);
    if (blocchi.length > 0) {
      setError(blocchi.join(" "));
      return;
    }
    start(async () => {
      const res = await createQuote(payload());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const url = `${location.origin}/preventivo/${res.token}`;
      if (apri) window.open(url, "_blank", "noopener");
      setLink(url);
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_400px] lg:items-start">
      {/* ============ COLONNA SINISTRA: composizione ============ */}
      <div className="flex flex-col gap-4">
        {/* Cliente compatto */}
        <Card className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-text">{clientNome}</div>
            {clientReferente && (
              <div className="text-[13px] text-text-2">{clientReferente}</div>
            )}
          </div>
          <Link
            href={`/vendite/clienti/${clientId}`}
            className="flex-none text-[13px] font-semibold text-link hover:underline"
          >
            Cambia cliente
          </Link>
        </Card>

        {/* Cosa comprende */}
        <Card>
          <CardTitle>Cosa comprende</CardTitle>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CATALOG.map((svc) => {
              const s = sel[svc.key];
              const on = !!s?.selected;
              return (
                <div
                  key={svc.key}
                  className={cn(
                    "rounded-field border p-2.5 transition-colors",
                    on ? "border-ink bg-card-2" : "border-line",
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
                          {svc.option.choices!.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => toggleChannel(svc.key, c.value)}
                              className={cn(
                                "rounded-badge px-2.5 py-1 text-[12px] font-semibold",
                                s?.channels?.includes(c.value)
                                  ? "bg-ink text-on-ink"
                                  : "bg-bg-2 text-text-2",
                              )}
                            >
                              {c.label}
                            </button>
                          ))}
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
                                "rounded-badge px-2.5 py-1 text-[12px] font-semibold",
                                s?.tipo === c.value
                                  ? "bg-ink text-on-ink"
                                  : "bg-bg-2 text-text-2",
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
                          className="w-24 rounded-field border border-line bg-card px-2 py-1 text-[13px]"
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
                            "rounded-badge px-2 py-0.5 font-semibold",
                            durataOf(svc) === m
                              ? "bg-ink text-on-ink"
                              : "bg-bg-2 text-text-2",
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
                          <span className="text-text-3">
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
                          className="w-24 rounded-field border border-line bg-card px-2 py-1 text-right text-[13px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Addon */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text-2">
                Voci libere / dal catalogo
              </span>
              <button
                type="button"
                onClick={() =>
                  setAddons((a) => [
                    ...a,
                    { descrizione: "", prezzo: 0, tipo: "ricorrente", durata: 12 },
                  ])
                }
                className="text-[13px] font-semibold text-link hover:underline"
              >
                + Voce libera
              </button>
            </div>

            {serviziExtra.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {serviziExtra.map((s) => (
                  <button
                    key={s.chiave}
                    type="button"
                    onClick={() =>
                      setAddons((a) => [
                        ...a,
                        {
                          descrizione: s.titolo,
                          prezzo: s.prezzo_base ?? 0,
                          tipo: s.ricorrente ? "ricorrente" : "una_tantum",
                          durata: s.ricorrente ? s.durata_mesi : undefined,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 rounded-badge border border-line bg-card-2 px-3 py-1.5 text-[12.5px] font-semibold text-text transition-colors hover:border-line-strong"
                  >
                    + {s.titolo}
                    {s.prezzo_base != null && (
                      <span className="text-text-3">
                        {euro(s.prezzo_base)}
                        {s.ricorrente ? "/mese" : ""}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {addons.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                {addons.map((ad, i) => (
                  <div key={i} className="rounded-field border border-line p-2.5">
                    <div className="flex items-start gap-2">
                      <input
                        value={ad.descrizione}
                        onChange={(e) =>
                          setAddons((a) =>
                            a.map((x, j) =>
                              j === i ? { ...x, descrizione: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Descrizione (es. Mantenimento dominio + hosting)"
                        className="min-w-0 flex-1 rounded-field border border-line bg-card px-2.5 py-1.5 text-[13px]"
                      />
                      <button
                        type="button"
                        onClick={() => setAddons((a) => a.filter((_, j) => j !== i))}
                        className="px-1 text-text-3 hover:text-fail-tx"
                        aria-label="Rimuovi voce"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-text-2">
                      <select
                        value={ad.tipo}
                        onChange={(e) =>
                          setAddons((a) =>
                            a.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    tipo: e.target.value as Addon["tipo"],
                                    durata:
                                      e.target.value === "ricorrente"
                                        ? (x.durata ?? 12)
                                        : undefined,
                                  }
                                : x,
                            ),
                          )
                        }
                        className="rounded-field border border-line bg-card px-2 py-1 text-[12px]"
                      >
                        <option value="ricorrente">Ricorrente</option>
                        <option value="una_tantum">Una tantum</option>
                      </select>
                      {ad.tipo === "ricorrente" && (
                        <span className="flex items-center gap-1">
                          Durata:
                          {[3, 6, 9, 12].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() =>
                                setAddons((a) =>
                                  a.map((x, j) => (j === i ? { ...x, durata: m } : x)),
                                )
                              }
                              className={cn(
                                "rounded-badge px-2 py-0.5 font-semibold",
                                (ad.durata ?? 12) === m
                                  ? "bg-ink text-on-ink"
                                  : "bg-bg-2 text-text-2",
                              )}
                            >
                              {m}m
                            </button>
                          ))}
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-1.5">
                        <input
                          type="number"
                          value={ad.prezzo || ""}
                          onChange={(e) =>
                            setAddons((a) =>
                              a.map((x, j) =>
                                j === i ? { ...x, prezzo: Number(e.target.value) } : x,
                              ),
                            )
                          }
                          placeholder={ad.tipo === "ricorrente" ? "€/mese" : "€"}
                          className="w-24 rounded-field border border-line bg-card px-2 py-1 text-right text-[12px]"
                        />
                        {ad.tipo === "ricorrente" && (ad.prezzo || 0) > 0 && (
                          <span className="text-text-3">= {euro(addonContributo(ad))}</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sconto + motivo */}
          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3">
            <label className="flex items-center justify-between gap-3 text-[13px] text-text-2">
              <span>Sconto (€)</span>
              <input
                type="number"
                value={sconto}
                onChange={(e) => setSconto(e.target.value)}
                placeholder="0"
                className="w-28 rounded-field border border-line bg-card px-2 py-1 text-right text-[13px]"
              />
            </label>
            {scontoNum > 0 && (
              <Input
                label="Motivo dello sconto"
                labelRight="verrà mostrato al cliente"
                value={motivoSconto}
                onChange={(e) => setMotivoSconto(e.target.value)}
                placeholder="es. Cliente storico, sconto fedeltà"
              />
            )}
          </div>
        </Card>

        {/* Come si paga */}
        <Card>
          <CardTitle>Come si paga</CardTitle>
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold text-text-2">Formula</span>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as Tipo)}
                className="w-full rounded-field border border-line-field bg-card px-3.5 py-2.5 text-sm text-text focus:border-ink focus:outline-none"
              >
                <option value="ricorrente">Ricorrente (rate mensili)</option>
                <option value="una_tantum">Una tantum</option>
                <option value="acconto">Acconto</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              {ricorrente && (
                <Input
                  label="Numero rate"
                  type="number"
                  value={rateTouched ? rateNum : String(mesiContratto)}
                  onChange={(e) => {
                    setRateTouched(true);
                    setRateNum(e.target.value);
                  }}
                />
              )}
              <Input
                label="Prima rata"
                labelRight="addebiti manuali"
                type="date"
                value={dataPrimaRata}
                onChange={(e) => setDataPrimaRata(e.target.value)}
              />
            </div>

            {scadenze.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[12.5px] font-semibold text-text-2">
                  Scadenze generate
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {scadenze.slice(0, 8).map((r) => (
                    <span
                      key={r.numero_rata}
                      className="rounded-badge bg-card-2 px-2.5 py-1 text-[12px] font-semibold text-text-2"
                    >
                      {dataIt(r.scadenza)} · {euro(r.importo)}
                    </span>
                  ))}
                  {scadenze.length > 8 && (
                    <span className="rounded-badge px-2.5 py-1 text-[12px] font-semibold text-text-3">
                      +{scadenze.length - 8}
                    </span>
                  )}
                </div>
                {totaleRicorrenteMensile > 0 && (
                  <span className="inline-flex w-fit rounded-badge bg-violet-soft px-2.5 py-1 text-[12px] font-semibold text-info-tx">
                    Ricorrente {euro(totaleRicorrenteMensile)}/mese
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Validità */}
        <Card>
          <CardTitle>Validità</CardTitle>
          <div className="mt-3">
            <Input
              label="Valido fino al"
              type="date"
              value={validoFino}
              onChange={(e) => setValidoFino(e.target.value)}
            />
          </div>
        </Card>
      </div>

      {/* ============ COLONNA DESTRA: denaro + invio ============ */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-6">
        <MoneyBlock>
          <div className="flex flex-col gap-4">
            {totaleUnaTantum > 0 && (
              <MoneyAmount label="Una tantum" amount={euro(totaleUnaTantum)} note="IVA esclusa" />
            )}
            {totaleRicorrenteMensile > 0 && (
              <MoneyAmount
                label="Ricorrente"
                amount={euro(totaleRicorrenteMensile)}
                unit="/mese"
                note="IVA esclusa"
              />
            )}
            {totaleUnaTantum === 0 && totaleRicorrenteMensile === 0 && (
              <MoneyAmount label="Totale" amount={euro(0)} />
            )}
            <div className="flex flex-col gap-1.5 border-t border-[#2c2e31] pt-3">
              <MoneyRow label="Listino servizi" value={euro(totaleServizi)} />
              {scontoNum > 0 && (
                <MoneyRow label="Sconto" value={`− ${euro(scontoNum)}`} tone="mint" />
              )}
              <MoneyRow label="Totale (netto)" value={euro(totaleContratto)} />
              <MoneyRow label="IVA 22%" value={euro(conIva(totaleContratto) - totaleContratto)} />
            </div>
            <div className="border-t border-[#2c2e31] pt-3">
              <MoneyRow
                label="Primo incasso alla firma"
                value={euro(conIva(primoIncassoNetto))}
                tone="mint"
              />
            </div>
          </div>
        </MoneyBlock>

        {link ? (
          <Card>
            <p className="text-[14px] font-bold text-on-mint">Preventivo creato ✓</p>
            <p className="mt-1 text-[13px] text-text-2">
              Link pubblico da inviare al cliente:
            </p>
            <div className="mt-2 flex gap-2">
              <input
                readOnly
                value={link}
                className="w-full rounded-field border border-line bg-card-2 px-2.5 py-1.5 text-[13px] text-text-2"
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
            <Link
              href={`/vendite/clienti/${clientId}`}
              className="mt-3 inline-flex text-[13px] font-semibold text-link hover:underline"
            >
              ← Torna alla scheda
            </Link>
          </Card>
        ) : (
          <>
            <Card>
              <CardTitle>Prima di inviare</CardTitle>
              <div className="mt-3">
                <PreflightList items={preflight} />
              </div>
            </Card>

            <Card dark>
              <div className="text-[12px] font-semibold uppercase tracking-wide text-on-ink/60">
                Quando premi Invia
              </div>
              <ol className="mt-2.5 flex flex-col gap-1.5 text-[13px] text-on-ink/85">
                <li>1 · Il cliente riceve il link (portale + WhatsApp)</li>
                <li>2 · Accetta e firma il contratto su DocuSeal</li>
                <li>3 · Imposta il pagamento → parte il piano rate</li>
                <li>4 · La trattativa passa a “Vinta”</li>
              </ol>
            </Card>

            {error && (
              <p className="rounded-field bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button onClick={() => invia(false)} disabled={pending}>
                {pending ? "Invio…" : "Invia per la firma"}
              </Button>
              <Button variant="secondary" onClick={() => invia(true)} disabled={pending}>
                Vedi come il cliente
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
