"use client";

import { useState, useRef, useTransition } from "react";
import {
  savePortfolioItem,
  deletePortfolioItem,
  uploadImmagine,
  type PortfolioInput,
} from "@/lib/catalogo/actions";
import type { PortfolioItemRow } from "@/lib/catalogo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const empty = (serviceId: string, ordine: number): PortfolioInput => ({
  service_id: serviceId, titolo: "", cliente: "", settore: "",
  descrizione: "", risultato: "", link_url: "", immagine_url: null, ordine,
});

export function PortfolioManager({
  serviceId,
  initial,
}: {
  serviceId: string;
  initial: PortfolioItemRow[];
}) {
  const [items, setItems] = useState<PortfolioItemRow[]>(initial);
  const [draft, setDraft] = useState<PortfolioInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof PortfolioInput>(k: K, v: PortfolioInput[K]) =>
    setDraft((p) => (p ? { ...p, [k]: v } : p));

  function edit(it: PortfolioItemRow) {
    setError(null);
    setDraft({
      id: it.id, service_id: serviceId, titolo: it.titolo,
      cliente: it.cliente ?? "", settore: it.settore ?? "",
      descrizione: it.descrizione ?? "", risultato: it.risultato ?? "",
      link_url: it.link_url ?? "", immagine_url: it.immagine_url, ordine: it.ordine,
    });
  }

  function reload() {
    // Ricarica soft: dopo il salvataggio la revalidatePath aggiorna il server;
    // qui aggiorniamo lo stato locale in modo ottimistico via window.location.
    window.location.reload();
  }

  function save() {
    if (!draft) return;
    setError(null);
    start(async () => {
      const res = await savePortfolioItem(draft);
      if (res.ok) { setDraft(null); reload(); }
      else setError(res.error);
    });
  }

  function remove(id: string) {
    start(async () => {
      const res = await deletePortfolioItem(id);
      if (res.ok) setItems((l) => l.filter((x) => x.id !== id));
      else setError(res.error);
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft) return;
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("prefix", `portfolio/${serviceId}`);
      const up = await uploadImmagine(fd);
      if (up.ok) set("immagine_url", up.url);
      else setError(up.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-line">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-text">{it.titolo}</div>
              <div className="truncate text-[12.5px] text-text-3">
                {[it.cliente, it.settore].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            <div className="flex flex-none gap-2">
              <button onClick={() => edit(it)} className="text-[13px] font-semibold text-violet hover:underline">Modifica</button>
              <button onClick={() => remove(it.id)} disabled={pending} className="text-[13px] font-semibold text-fail-tx hover:underline">Elimina</button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="py-2 text-[13px] text-text-3">Nessun lavoro ancora.</li>}
      </ul>

      {draft ? (
        <div className="flex flex-col gap-2.5 rounded-md border border-line p-4">
          <Input label="Titolo" value={draft.titolo} onChange={(e) => set("titolo", e.target.value)} />
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Cliente" value={draft.cliente} onChange={(e) => set("cliente", e.target.value)} />
            <Input label="Settore" value={draft.settore} onChange={(e) => set("settore", e.target.value)} />
          </div>
          <Input label="Descrizione" value={draft.descrizione} onChange={(e) => set("descrizione", e.target.value)} />
          <div className="grid grid-cols-2 gap-2.5">
            <Input label="Risultato" value={draft.risultato} onChange={(e) => set("risultato", e.target.value)} />
            <Input label="Link" value={draft.link_url} onChange={(e) => set("link_url", e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
            <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} disabled={pending}>
              {draft.immagine_url ? "Cambia immagine" : "Aggiungi immagine"}
            </Button>
            {draft.immagine_url && <span className="text-[12px] text-text-3">immagine caricata</span>}
          </div>
          {error && <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={pending}>{pending ? "Salvataggio…" : "Salva lavoro"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)} disabled={pending}>Annulla</Button>
          </div>
        </div>
      ) : (
        <div>
          <Button size="sm" variant="ghost" onClick={() => setDraft(empty(serviceId, items.length + 1))}>
            + Aggiungi lavoro
          </Button>
        </div>
      )}
    </div>
  );
}
