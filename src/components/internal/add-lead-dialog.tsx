"use client";

import { useRef, useState, useTransition } from "react";
import { addLead } from "@/app/(app)/vendite/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function close() {
    setOpen(false);
    setError(null);
    formRef.current?.reset();
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await addLead(formData);
      if (res.ok) close();
      else setError(res.error);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Nuovo lead
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/25 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-card bg-card p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-extrabold tracking-[-0.01em] text-text">
              Nuovo lead
            </h2>
            <p className="mt-1 text-sm text-text-2">
              Entra in pipeline nella colonna Lead, assegnato a te.
            </p>

            <form ref={formRef} action={onSubmit} className="mt-5 flex flex-col gap-3.5">
              <Input
                name="ragione_sociale"
                label="Ragione sociale"
                placeholder="Es. Bar Centrale"
                required
                autoFocus
              />
              <Input name="referente" label="Referente" placeholder="Es. Luca Rossi" />
              <div className="grid grid-cols-2 gap-3.5">
                <Input name="email" type="email" label="Email" placeholder="luca@…" />
                <Input name="telefono" label="Telefono" placeholder="+39 …" />
              </div>

              {error && (
                <p className="rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
                  {error}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2.5">
                <Button type="button" variant="ghost" onClick={close}>
                  Annulla
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Salvataggio…" : "Aggiungi lead"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
