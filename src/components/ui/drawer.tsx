"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Pannello laterale (destra) + scrim. Base di 7a e dei futuri pannelli.
 * Vincoli v0.4: zero-motion (nessuna animazione d'ingresso), scrim cliccabile,
 * ESC chiude, focus trap + focus iniziale sul primo campo, ombra del sistema.
 * Controllato: il genitore gestisce `open`.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  width = 520,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // focus iniziale sul primo elemento focusabile del pannello
    const first =
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? null;
    first?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  function trap(e: React.KeyboardEvent) {
    if (e.key !== "Tab") return;
    const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Chiudi"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(22,23,26,0.34)]"
      />
      <div
        ref={panelRef}
        onKeyDown={trap}
        style={{ width }}
        className="absolute inset-y-0 right-0 flex max-w-full flex-col border-l border-line-strong bg-panel shadow-drawer"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-text">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[13px] leading-relaxed text-text-2">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid size-[30px] flex-none place-items-center rounded-field bg-[#eceee8] text-text-2 transition-colors hover:text-text"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="border-t border-line px-5 py-3.5">{footer}</div>
        )}
      </div>
    </div>
  );
}
