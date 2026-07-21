"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Pannello a scomparsa sulla destra (desktop) / a tutto schermo (mobile).
 * Aperto tramite intercepting route: chiuderlo = router.back() (ripristina
 * l'URL precedente). Chiude anche con Esc e clic sullo sfondo.
 */
export function Drawer({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // rAF: monta "chiuso" poi apre al frame successivo → parte la transizione.
    const raf = requestAnimationFrame(() => setOpen(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [router]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Chiudi"
        onClick={() => router.back()}
        className={`absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-[860px] flex-col bg-bg shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg/90 px-6 py-3 backdrop-blur">
          <span className="text-[13px] font-bold uppercase tracking-wide text-text-3">
            {title ?? "Dettaglio"}
          </span>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Chiudi"
            className="grid size-9 place-items-center rounded-pill border border-line bg-card text-text-2 transition-colors hover:bg-card-2 hover:text-text"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </aside>
    </div>
  );
}
