"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { HomeTask, HomeTone, HomeIcon } from "@/lib/home/queries";

const TONE: Record<HomeTone, { panel: string; tx: string }> = {
  fail: { panel: "bg-fail-bg", tx: "text-fail-tx" },
  wait: { panel: "bg-wait-bg", tx: "text-wait-tx" },
  info: { panel: "bg-info-bg", tx: "text-info-tx" },
};

export function DaGestire({ tasks }: { tasks: HomeTask[] }) {
  const [i, setI] = useState(0);

  if (tasks.length === 0) {
    return (
      <section className="rounded-card border border-line bg-card p-6">
        <h2 className="text-lg font-extrabold tracking-[-0.01em] text-text">
          Da gestire
        </h2>
        <div className="mt-4 grid place-items-center rounded-md bg-paid-bg py-10 text-center">
          <CheckIcon className="size-8 text-paid-tx" />
          <p className="mt-2 text-sm font-bold text-paid-tx">
            Tutto in regola
          </p>
          <p className="text-[13px] text-paid-tx/80">
            Nessuna cosa urgente da gestire adesso.
          </p>
        </div>
      </section>
    );
  }

  const idx = Math.min(i, tasks.length - 1);
  const t = tasks[idx];
  const tone = TONE[t.tone];
  const go = (n: number) => setI((idx + n + tasks.length) % tasks.length);

  return (
    <section className="rounded-card border border-line bg-card p-5">
      <div className="mb-3.5 flex items-center justify-between px-1">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-lg font-extrabold tracking-[-0.01em] text-text">
            Da gestire
          </h2>
          <span className="text-[13px] font-bold text-text-3">
            {idx + 1} di {tasks.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Precedente"
            className="grid size-9 place-items-center rounded-pill border border-line bg-card text-text transition-colors hover:bg-card-2"
          >
            <ChevronIcon className="size-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Successivo"
            className="grid size-9 place-items-center rounded-pill border border-line bg-card text-text transition-colors hover:bg-card-2"
          >
            <ChevronIcon className="size-4" />
          </button>
        </div>
      </div>

      <div className={cn("rounded-md p-6", tone.panel)}>
        <div className="mb-4 flex items-center justify-between">
          <span
            className={cn(
              "grid size-11 place-items-center rounded-[13px] bg-card",
              tone.tx,
            )}
          >
            <TaskIcon icon={t.icon} className="size-[21px]" />
          </span>
          <span
            className={cn(
              "rounded-pill bg-card px-3 py-1.5 text-[12px] font-extrabold",
              tone.tx,
            )}
          >
            {t.pill}
          </span>
        </div>

        <div className="text-[15px] font-bold text-text-2">{t.cliente}</div>
        <div className="tnum mt-1 text-[44px] font-extrabold leading-none tracking-[-0.04em] text-text">
          {t.hero}
        </div>
        <p className={cn("mt-3 text-[13.5px] font-semibold", tone.tx)}>
          {t.ctx}
        </p>

        <div className="mt-5 flex items-center gap-2.5">
          {t.actions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={cn(
                "rounded-pill px-5 py-2.5 text-[13.5px] font-bold transition-opacity hover:opacity-90",
                a.primary
                  ? "bg-ink text-on-ink"
                  : "border border-black/10 bg-card text-text",
              )}
            >
              {a.label}
            </Link>
          ))}
          {tasks.length > 1 && (
            <button
              type="button"
              onClick={() => go(1)}
              className="ml-auto p-2 text-[13px] font-bold text-text-3 transition-colors hover:text-text-2"
            >
              Salta →
            </button>
          )}
        </div>
      </div>

      {tasks.length > 1 && (
        <div className="mt-3.5 flex justify-center gap-1.5">
          {tasks.map((task, k) => (
            <span
              key={task.id}
              className={cn(
                "h-[7px] rounded-pill transition-all",
                k === idx ? "w-5 bg-ink" : "w-[7px] bg-line",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TaskIcon({
  icon,
  className,
}: {
  icon: HomeIcon;
  className?: string;
}) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (icon) {
    case "alert":
      return (
        <svg viewBox="0 0 24 24" className={className} {...p}>
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      );
    case "bank":
      return (
        <svg viewBox="0 0 24 24" className={className} {...p}>
          <path d="M3 21h18M4 10h16M5 10 12 4l7 6M6 10v11M18 10v11M10 10v11M14 10v11" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" className={className} {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "card":
      return (
        <svg viewBox="0 0 24 24" className={className} {...p}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      );
    case "doc":
      return (
        <svg viewBox="0 0 24 24" className={className} {...p}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h5" />
        </svg>
      );
  }
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}
