"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  creaClienteEsistente,
  uploadContrattoPdf,
} from "@/lib/clienti/manual";
import { CATALOG, type OrdineSelezione } from "@/lib/catalog";
import { euro } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Anag {
  ragione_sociale: string;
  email: string;
  referente: string;
  telefono: string;
  p_iva: string;
  codice_fiscale: string;
  codice_sdi: string;
  pec: string;
  indirizzo: string;
}

const EMPTY_ANAG: Anag = {
  ragione_sociale: "",
  email: "",
  referente: "",
  telefono: "",
  p_iva: "",
  codice_fiscale: "",
  codice_sdi: "",
  pec: "",
  indirizzo: "",
};

type Sel = Record<string, { selected: boolean; durata?: number }>;

export function ClienteEsistenteForm() {
  const router = useRouter();
  const [a, setA] = useState<Anag>(EMPTY_ANAG);
  const [sel, setSel] = useState<Sel>({});
  const [firmatoIl, setFirmatoIl] = useState("");
  const [rataMensile, setRataMensile] = useState("");
  const [rateNum, setRateNum] = useState("12");
  const [primaScadenza, setPrimaScadenza] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const pdfRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof Anag, v: string) => setA((p) => ({ ...p, [k]: v }));
  const totale =
    (Number(rataMensile) || 0) * (Math.trunc(Number(rateNum)) || 0);

  function toggleServizio(key: string, on: boolean, ricorrente: boolean) {
    setSel((s) => ({
      ...s,
      [key]: { selected: on, durata: ricorrente ? (s[key]?.durata ?? 12) : undefined },
    }));
  }

  function submit() {
    setError(null);
    start(async () => {
      // ordine per il portale (servizi attivi)
      const ordine: OrdineSelezione = {};
      for (const c of CATALOG) {
        if (sel[c.key]?.selected) {
          ordine[c.key] = {
            selected: true,
            ...(c.ricorrente ? { durata: sel[c.key]?.durata ?? 12 } : {}),
          };
        }
      }

      // upload PDF (opzionale)
      let signedPdfUrl: string | null = null;
      const file = pdfRef.current?.files?.[0];
      if (file) {
        const fd = new FormData();
        fd.set("file", file);
        const up = await uploadContrattoPdf(fd);
        if (!up.ok) {
          setError(up.error);
          return;
        }
        signedPdfUrl = up.url;
      }

      const res = await creaClienteEsistente({
        ragione_sociale: a.ragione_sociale,
        email: a.email || null,
        referente: a.referente || null,
        telefono: a.telefono || null,
        p_iva: a.p_iva || null,
        codice_fiscale: a.codice_fiscale || null,
        codice_sdi: a.codice_sdi || null,
        pec: a.pec || null,
        indirizzo: a.indirizzo || null,
        ordine,
        firmatoIl,
        signedPdfUrl,
        rataMensile: Number(rataMensile) || 0,
        rateNum: Math.trunc(Number(rateNum)) || 0,
        primaScadenza,
      });
      if (res.ok) router.push(`/vendite/clienti/${res.clientId}`);
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Anagrafica */}
      <section>
        <h2 className="mb-3 text-[15px] font-bold text-text">Anagrafica</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Ragione sociale"
              required
              value={a.ragione_sociale}
              onChange={(e) => set("ragione_sociale", e.target.value)}
            />
          </div>
          <Input label="Email (per l'accesso al portale)" type="email" value={a.email} onChange={(e) => set("email", e.target.value)} />
          <Input label="Referente" value={a.referente} onChange={(e) => set("referente", e.target.value)} />
          <Input label="Telefono" value={a.telefono} onChange={(e) => set("telefono", e.target.value)} />
          <Input label="Partita IVA" value={a.p_iva} onChange={(e) => set("p_iva", e.target.value)} />
          <Input label="Codice Fiscale" value={a.codice_fiscale} onChange={(e) => set("codice_fiscale", e.target.value)} />
          <Input label="Codice SDI" value={a.codice_sdi} onChange={(e) => set("codice_sdi", e.target.value)} />
          <Input label="PEC" value={a.pec} onChange={(e) => set("pec", e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Indirizzo" value={a.indirizzo} onChange={(e) => set("indirizzo", e.target.value)} />
          </div>
        </div>
      </section>

      {/* Servizi attivi */}
      <section>
        <h2 className="mb-1 text-[15px] font-bold text-text">Servizi attivi</h2>
        <p className="mb-3 text-[12.5px] text-text-3">
          Quali servizi ha in essere — compaiono nel suo portale.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CATALOG.map((c) => {
            const on = !!sel[c.key]?.selected;
            return (
              <div
                key={c.key}
                className={cn(
                  "rounded-md border p-2.5 transition-colors",
                  on ? "border-violet bg-violet-soft/40" : "border-line",
                )}
              >
                <label className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => toggleServizio(c.key, e.target.checked, !!c.ricorrente)}
                    className="size-4 accent-ink"
                  />
                  <span className="text-[14px] font-semibold text-text">{c.label}</span>
                  {c.ricorrente && <span className="text-[11px] text-text-3">ricorrente</span>}
                </label>
                {on && c.ricorrente && (
                  <div className="mt-2 flex items-center gap-2 pl-6 text-[12px] text-text-2">
                    Durata:
                    {[3, 6, 9, 12].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setSel((s) => ({ ...s, [c.key]: { selected: true, durata: m } }))
                        }
                        className={cn(
                          "rounded-pill px-2 py-0.5 font-semibold",
                          (sel[c.key]?.durata ?? 12) === m
                            ? "bg-ink text-on-ink"
                            : "bg-card-2 text-text-2",
                        )}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contratto */}
      <section>
        <h2 className="mb-3 text-[15px] font-bold text-text">Contratto firmato</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Data di firma"
            type="date"
            required
            value={firmatoIl}
            onChange={(e) => setFirmatoIl(e.target.value)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-text-2">PDF firmato (opzionale)</span>
            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf"
              className="text-[13px] text-text-2 file:mr-3 file:rounded-pill file:border-0 file:bg-card-2 file:px-3 file:py-1.5 file:text-[12.5px] file:font-semibold"
            />
          </label>
        </div>
      </section>

      {/* Piano rate */}
      <section>
        <h2 className="mb-1 text-[15px] font-bold text-text">Piano rate (SDD Banca Sella)</h2>
        <p className="mb-3 text-[12.5px] text-text-3">
          Genero le rate mensili; le segnerai pagate man mano che Sella addebita.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Importo rata (€)"
            type="number"
            required
            value={rataMensile}
            onChange={(e) => setRataMensile(e.target.value)}
          />
          <Input
            label="Numero rate"
            type="number"
            required
            value={rateNum}
            onChange={(e) => setRateNum(e.target.value)}
          />
          <Input
            label="Data prima rata"
            type="date"
            required
            value={primaScadenza}
            onChange={(e) => setPrimaScadenza(e.target.value)}
          />
        </div>
        {totale > 0 && (
          <p className="mt-2 text-[13px] text-text-2">
            Totale piano: <b className="tnum">{euro(totale)}</b>
          </p>
        )}
      </section>

      {error && (
        <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
          {error}
        </p>
      )}

      <Button onClick={submit} disabled={pending} className="self-start">
        {pending ? "Creazione…" : "Crea cliente"}
      </Button>
    </div>
  );
}
