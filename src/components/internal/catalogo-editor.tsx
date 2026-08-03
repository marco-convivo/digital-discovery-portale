"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateServizio,
  uploadImmagine,
  setImmagineServizio,
  deleteServizio,
  type ServizioContenuto,
} from "@/lib/catalogo/actions";
import { euro } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { ImgPlaceholder } from "@/components/catalogo/placeholder";
import { cn } from "@/lib/utils";

const splitVoci = (s: string) =>
  s.split("\n").map((r) => r.trim()).filter(Boolean);

// Stato locale: le liste sono array di voci (non più textarea multilinea).
interface EditorState {
  titolo: string;
  sottotitolo: string;
  descrizione: string;
  attivita_incluse: string[];
  condizioni: string[];
  attivita_escluse: string[];
  prezzo_base: number | null;
  ricorrente: boolean;
  durata_mesi: number;
  ordine: number;
  in_vetrina: boolean;
  vendibile: boolean;
}

function Area({ label, value, onChange, hint }: {
  label: string; value: string; hint?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-semibold text-text-2">{label}</span>
      {hint && <span className="mb-1 block text-[12px] text-text-3">{hint}</span>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-field border border-line-field bg-card px-3 py-2 text-[14px] text-text outline-none focus:border-ink"
      />
    </label>
  );
}

/** Editor di una lista di voci: aggiungi, modifica, rimuovi, riordina. */
function ListaVoci({
  label,
  hint,
  voci,
  onChange,
}: {
  label: string;
  hint?: string;
  voci: string[];
  onChange: (v: string[]) => void;
}) {
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= voci.length) return;
    const next = [...voci];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <span className="mb-1 block text-[13px] font-semibold text-text-2">{label}</span>
      {hint && <span className="mb-2 block text-[12px] text-text-3">{hint}</span>}
      <div className="flex flex-col gap-1.5">
        {voci.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={`Sposta "${v || "voce"}" — frecce su/giù`}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") { e.preventDefault(); move(i, -1); }
                if (e.key === "ArrowDown") { e.preventDefault(); move(i, 1); }
              }}
              className="grid size-7 flex-none cursor-grab place-items-center rounded-field text-text-3 hover:bg-card-2 focus:outline-2 focus:outline-ink"
            >
              <span aria-hidden className="text-[13px] leading-none tracking-tighter">⋮⋮</span>
            </button>
            <input
              value={v}
              onChange={(e) =>
                onChange(voci.map((x, j) => (j === i ? e.target.value : x)))
              }
              placeholder="Aggiungi una voce…"
              className="min-w-0 flex-1 rounded-field border border-line-field bg-card px-3 py-1.5 text-[13.5px] text-text outline-none focus:border-ink"
            />
            <button
              type="button"
              onClick={() => onChange(voci.filter((_, j) => j !== i))}
              aria-label="Rimuovi voce"
              className="grid size-7 flex-none place-items-center rounded-field text-text-3 hover:text-fail-tx"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...voci, ""])}
        className="mt-2 text-[13px] font-semibold text-link hover:underline"
      >
        + Aggiungi voce
      </button>
    </div>
  );
}

export function CatalogoEditor({
  chiave,
  immagineUrl,
  initial,
}: {
  chiave: string;
  immagineUrl: string | null;
  initial: ServizioContenuto;
}) {
  const router = useRouter();
  const [d, setD] = useState<EditorState>({
    titolo: initial.titolo,
    sottotitolo: initial.sottotitolo,
    descrizione: initial.descrizione,
    attivita_incluse: splitVoci(initial.attivita_incluse),
    condizioni: splitVoci(initial.condizioni),
    attivita_escluse: splitVoci(initial.attivita_escluse),
    prezzo_base: initial.prezzo_base,
    ricorrente: initial.ricorrente,
    durata_mesi: initial.durata_mesi,
    ordine: initial.ordine,
    in_vetrina: initial.in_vetrina,
    vendibile: initial.vendibile,
  });
  const [img, setImg] = useState<string | null>(immagineUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof EditorState>(k: K, v: EditorState[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  function save() {
    setError(null); setSaved(false);
    // La server action lavora ancora su stringhe multilinea → uniamo le voci.
    const payload: ServizioContenuto = {
      titolo: d.titolo,
      sottotitolo: d.sottotitolo,
      descrizione: d.descrizione,
      attivita_incluse: d.attivita_incluse.filter(Boolean).join("\n"),
      condizioni: d.condizioni.filter(Boolean).join("\n"),
      attivita_escluse: d.attivita_escluse.filter(Boolean).join("\n"),
      prezzo_base: d.prezzo_base,
      ricorrente: d.ricorrente,
      durata_mesi: d.durata_mesi,
      ordine: d.ordine,
      in_vetrina: d.in_vetrina,
      vendibile: d.vendibile,
    };
    start(async () => {
      const res = await updateServizio(chiave, payload);
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  }

  function elimina() {
    setError(null);
    start(async () => {
      const res = await deleteServizio(chiave);
      if (res.ok) router.push("/vendite/catalogo");
      else setError(res.error);
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("prefix", `servizio/${chiave}`);
      const up = await uploadImmagine(fd);
      if (!up.ok) { setError(up.error); return; }
      const res = await setImmagineServizio(chiave, up.url);
      if (res.ok) setImg(up.url);
      else setError(res.error);
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
      {/* ---- FORM ---- */}
      <Card>
        <CardTitle>Contenuti e prezzo</CardTitle>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-32 flex-none overflow-hidden rounded-field border border-line">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImgPlaceholder />
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
              <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} disabled={pending}>
                Cambia immagine
              </Button>
              <p className="mt-1 text-[12px] text-text-3">JPG/PNG, max 5MB.</p>
            </div>
          </div>

          <Input label="Titolo" value={d.titolo} onChange={(e) => set("titolo", e.target.value)} />
          <Input label="Sottotitolo" value={d.sottotitolo} onChange={(e) => set("sottotitolo", e.target.value)} />
          <Area label="Descrizione" value={d.descrizione} onChange={(v) => set("descrizione", v)} />

          <ListaVoci label="Cosa facciamo" hint="Le attività incluse nel servizio." voci={d.attivita_incluse} onChange={(v) => set("attivita_incluse", v)} />
          <ListaVoci label="Come lavoriamo" hint="Condizioni e modo di lavorare." voci={d.condizioni} onChange={(v) => set("condizioni", v)} />
          <ListaVoci label="Cosa non è incluso" hint="Ciò che resta fuori dal servizio." voci={d.attivita_escluse} onChange={(v) => set("attivita_escluse", v)} />

          {/* Come si vende */}
          <div className="rounded-field border border-line p-3.5">
            <div className="text-[12.5px] font-semibold text-text-2">Come si vende</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Input label="Prezzo base (€)" type="number" value={d.prezzo_base ?? ""}
                onChange={(e) => set("prezzo_base", e.target.value === "" ? null : Number(e.target.value))} />
              <Input label="Ordine in vetrina" type="number" value={d.ordine}
                onChange={(e) => set("ordine", Number(e.target.value))} />
            </div>
            <div className="mt-3 grid grid-cols-2 items-end gap-3">
              <label className="flex items-center gap-2 text-[13.5px] text-text-2">
                <input type="checkbox" className="size-4 accent-ink" checked={d.ricorrente} onChange={(e) => set("ricorrente", e.target.checked)} />
                Ricorrente (mensile)
              </label>
              {d.ricorrente && (
                <Input label="Durata (mesi)" type="number" value={d.durata_mesi}
                  onChange={(e) => set("durata_mesi", Number(e.target.value))} />
              )}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[13.5px] text-text-2">
                <input type="checkbox" className="size-4 accent-ink" checked={d.in_vetrina} onChange={(e) => set("in_vetrina", e.target.checked)} />
                In vetrina <span className="text-text-3">— i clienti lo vedono</span>
              </label>
              <label className="flex items-center gap-2 text-[13.5px] text-text-2">
                <input type="checkbox" className="size-4 accent-ink" checked={d.vendibile} onChange={(e) => set("vendibile", e.target.checked)} />
                Vendibile <span className="text-text-3">— inseribile nei preventivi</span>
              </label>
            </div>
          </div>

          {error && <p className="rounded-field bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">{error}</p>}
          {saved && <p className="rounded-field bg-mint-soft px-3 py-2 text-[13px] text-text">Salvato.</p>}
          <div>
            <Button size="sm" onClick={save} disabled={pending}>
              {pending ? "Salvataggio…" : "Salva"}
            </Button>
          </div>

          {/* Elimina servizio */}
          <div className="mt-2 border-t border-line/60 pt-4">
            {!confirmDel ? (
              <button
                type="button"
                onClick={() => setConfirmDel(true)}
                className="text-[13px] font-semibold text-fail-tx hover:underline"
              >
                Elimina servizio dal catalogo
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[13px] text-text-2">
                  Eliminare <b>{d.titolo}</b>? Verranno rimossi anche i lavori di
                  portfolio collegati. L&apos;azione non è reversibile.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={elimina} disabled={pending} className="text-fail-tx">
                    {pending ? "Eliminazione…" : "Sì, elimina"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDel(false)} disabled={pending}>
                    Annulla
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ---- ANTEPRIMA VETRINA ---- */}
      <div className="lg:sticky lg:top-6">
        <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-text-3">
          Anteprima vetrina
        </div>
        <Card radius="portale" className="overflow-hidden p-0">
          <div className="h-36 w-full overflow-hidden bg-card-2">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImgPlaceholder />
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[16px] font-bold tracking-[-0.01em] text-text">
                {d.titolo || "Titolo servizio"}
              </h3>
              {!d.in_vetrina && (
                <span className="flex-none rounded-badge bg-bg-2 px-2 py-0.5 text-[11px] font-semibold text-text-3">
                  nascosto
                </span>
              )}
            </div>
            {d.sottotitolo && (
              <p className="mt-0.5 text-[13px] text-text-2">{d.sottotitolo}</p>
            )}
            {d.prezzo_base != null && (
              <p className="mt-2 text-[14px] font-extrabold text-text">
                {euro(d.prezzo_base)}
                {d.ricorrente && (
                  <span className="text-[12px] font-medium text-text-3">/mese</span>
                )}
              </p>
            )}
            {d.attivita_incluse.filter(Boolean).length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {d.attivita_incluse.filter(Boolean).slice(0, 5).map((v, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-text-2">
                    <span className={cn("mt-[3px] size-1.5 flex-none rounded-full bg-mint")} />
                    {v}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
