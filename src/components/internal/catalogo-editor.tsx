"use client";

import { useState, useRef, useTransition } from "react";
import {
  updateServizio,
  uploadImmagine,
  setImmagineServizio,
  type ServizioContenuto,
} from "@/lib/catalogo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImgPlaceholder } from "@/components/catalogo/placeholder";

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
        rows={4}
        className="w-full rounded-sm border border-line bg-card px-3 py-2 text-[14px] text-text outline-none focus:border-violet"
      />
    </label>
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
  const [d, setD] = useState<ServizioContenuto>(initial);
  const [img, setImg] = useState<string | null>(immagineUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ServizioContenuto>(k: K, v: ServizioContenuto[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  function save() {
    setError(null); setSaved(false);
    start(async () => {
      const res = await updateServizio(chiave, d);
      if (res.ok) setSaved(true);
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="h-20 w-32 flex-none overflow-hidden rounded-sm border border-line">
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
      <Area label="Cosa facciamo" hint="Una voce per riga" value={d.attivita_incluse} onChange={(v) => set("attivita_incluse", v)} />
      <Area label="Come lavoriamo (condizioni)" hint="Una voce per riga" value={d.condizioni} onChange={(v) => set("condizioni", v)} />
      <Area label="Cosa non è incluso" hint="Una voce per riga" value={d.attivita_escluse} onChange={(v) => set("attivita_escluse", v)} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Prezzo base (€)" type="number" value={d.prezzo_base ?? ""}
          onChange={(e) => set("prezzo_base", e.target.value === "" ? null : Number(e.target.value))} />
        <Input label="Ordine" type="number" value={d.ordine}
          onChange={(e) => set("ordine", Number(e.target.value))} />
      </div>
      <label className="flex items-center gap-2 text-[14px] text-text-2">
        <input type="checkbox" checked={d.attivo} onChange={(e) => set("attivo", e.target.checked)} />
        Visibile nella vetrina
      </label>

      {error && <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">{error}</p>}
      {saved && <p className="rounded-sm bg-mint-soft px-3 py-2 text-[13px] text-text">Salvato.</p>}
      <div>
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvataggio…" : "Salva"}
        </Button>
      </div>
    </div>
  );
}
