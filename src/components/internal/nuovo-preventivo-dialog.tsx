"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateQuoteForm } from "@/components/internal/create-quote-form";

export function NuovoPreventivoDialog({
  clientId,
  prezziBase,
}: {
  clientId: string;
  prezziBase: Record<string, number | null>;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function close() {
    setOpen(false);
    router.refresh(); // aggiorna la lista "Preventivi inviati"
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-pill bg-ink px-4 py-2 text-[13.5px] font-semibold text-on-ink transition-opacity hover:opacity-90"
      >
        + Nuovo preventivo
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Chiudi"
            onClick={close}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="relative z-10 my-4 w-full max-w-3xl rounded-card border border-line bg-card shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between rounded-t-card border-b border-line bg-card/95 px-6 py-3.5 backdrop-blur">
              <h2 className="text-[16px] font-extrabold tracking-[-0.01em] text-text">
                Nuovo preventivo
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Chiudi"
                className="grid size-9 place-items-center rounded-pill border border-line text-text-2 transition-colors hover:bg-card-2 hover:text-text"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <CreateQuoteForm clientId={clientId} prezziBase={prezziBase} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
