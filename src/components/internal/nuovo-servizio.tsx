"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createServizio } from "@/lib/catalogo/actions";
import { Button } from "@/components/ui/button";

export function NuovoServizio() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [titolo, setTitolo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function crea() {
    if (!titolo.trim()) return;
    setError(null);
    start(async () => {
      const res = await createServizio(titolo);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/vendite/catalogo/${res.chiave}`);
    });
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        + Nuovo servizio
      </Button>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center">
      <input
        autoFocus
        value={titolo}
        onChange={(e) => setTitolo(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && crea()}
        placeholder="Titolo del servizio"
        className="min-w-0 flex-1 rounded-sm border border-line bg-card px-3 py-2 text-[14px] text-text outline-none focus:border-violet"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={crea} disabled={pending || !titolo.trim()}>
          {pending ? "Creazione…" : "Crea bozza"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setTitolo("");
            setError(null);
          }}
          disabled={pending}
        >
          Annulla
        </Button>
      </div>
      {error && (
        <p className="w-full text-[12.5px] font-medium text-fail-tx">{error}</p>
      )}
    </div>
  );
}
