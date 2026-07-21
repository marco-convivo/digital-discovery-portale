"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ignoraAvviso, rimandaAvviso } from "@/lib/home/actions";
import type {
  HomeTask,
  HomeTone,
  HomeIcon,
  HomeGruppo,
} from "@/lib/home/queries";

const TONE: Record<HomeTone, { panel: string; tx: string }> = {
  fail: { panel: "bg-fail-bg", tx: "text-fail-tx" },
  wait: { panel: "bg-wait-bg", tx: "text-wait-tx" },
  info: { panel: "bg-info-bg", tx: "text-info-tx" },
};

const GRUPPO_LABEL: Record<HomeGruppo, string> = {
  insoluti: "Insoluti",
  scadenze: "Scadenze",
  pagamenti: "Pagamenti",
  preventivi: "Preventivi",
};
const GRUPPO_ORDINE: HomeGruppo[] = [
  "insoluti",
  "scadenze",
  "preventivi",
  "pagamenti",
];

type Filtro = "all" | HomeGruppo;

export function DaGestire({ tasks }: { tasks: HomeTask[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [i, setI] = useState(0);
  const [pending, start] = useTransition();

  const live = useMemo(
    () => tasks.filter((t) => !hidden.has(t.id)),
    [tasks, hidden],
  );
  const visible = useMemo(
    () => (filtro === "all" ? live : live.filter((t) => t.gruppo === filtro)),
    [live, filtro],
  );

  const gruppiPresenti = useMemo(
    () => GRUPPO_ORDINE.filter((g) => live.some((t) => t.gruppo === g)),
    [live],
  );
  const count = (f: Filtro) =>
    f === "all" ? live.length : live.filter((t) => t.gruppo === f).length;

  if (tasks.length === 0) {
    return (
      <section className="rounded-card border border-line bg-card p-6">
        <h2 className="text-lg font-extrabold tracking-[-0.01em] text-text">
          Da gestire
        </h2>
        <Vuoto messaggio="Nessuna cosa urgente da gestire adesso." />
      </section>
    );
  }

  const idx = Math.min(i, Math.max(0, visible.length - 1));
  const t = visible[idx];

  const setFilter = (f: Filtro) => {
    setFiltro(f);
    setI(0);
  };
  const go = (n: number) => {
    if (visible.length === 0) return;
    setI((idx + n + visible.length) % visible.length);
  };
  const chiudi = (fn: (c: string) => Promise<unknown>, task: HomeTask) => {
    start(async () => {
      await fn(task.chiave);
      setHidden((h) => new Set(h).add(task.id));
      setI(0);
    });
  };

  return (
    <section className="rounded-card border border-line bg-card p-5">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-lg font-extrabold tracking-[-0.01em] text-text">
            Da gestire
          </h2>
          {visible.length > 0 && (
            <span className="text-[13px] font-bold text-text-3">
              {idx + 1} di {visible.length}
            </span>
          )}
        </div>
        {visible.length > 1 && (
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
        )}
      </div>

      {gruppiPresenti.length > 1 && (
        <div className="mb-3.5 flex flex-wrap gap-2 px-1">
          <Chip label="Tutti" n={count("all")} active={filtro === "all"} onClick={() => setFilter("all")} />
          {gruppiPresenti.map((g) => (
            <Chip
              key={g}
              label={GRUPPO_LABEL[g]}
              n={count(g)}
              active={filtro === g}
              onClick={() => setFilter(g)}
            />
          ))}
        </div>
      )}

      {!t ? (
        <div className="rounded-md bg-card-2 py-10 text-center text-[13px] text-text-3">
          Nessun elemento in questa categoria.
        </div>
      ) : (
        <div className={cn("rounded-md p-6", TONE[t.tone].panel)}>
          <div className="mb-4 flex items-center justify-between">
            <span
              className={cn(
                "grid size-11 place-items-center rounded-[13px] bg-card",
                TONE[t.tone].tx,
              )}
            >
              <TaskIcon icon={t.icon} className="size-[21px]" />
            </span>
            <span
              className={cn(
                "rounded-pill bg-card px-3 py-1.5 text-[12px] font-extrabold",
                TONE[t.tone].tx,
              )}
            >
              {t.pill}
            </span>
          </div>

          <div className="text-[15px] font-bold text-text-2">{t.cliente}</div>
          <div className="mt-1 text-[42px] font-extrabold leading-none tracking-[-0.02em] [word-spacing:-0.06em] text-text">
            {t.hero}
          </div>
          <p className={cn("mt-3 text-[13.5px] font-semibold", TONE[t.tone].tx)}>
            {t.ctx}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
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
            <div className="ml-auto flex items-center gap-1">
              {t.dismissable && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => chiudi(ignoraAvviso, t)}
                  className="flex items-center gap-1.5 rounded-pill px-3 py-2 text-[12.5px] font-bold text-text-2 transition-colors hover:bg-card disabled:opacity-50"
                >
                  <CheckIcon className="size-4" />
                  Fatto
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => chiudi(rimandaAvviso, t)}
                className="flex items-center gap-1.5 rounded-pill px-3 py-2 text-[12.5px] font-bold text-text-3 transition-colors hover:bg-card disabled:opacity-50"
              >
                <SnoozeIcon className="size-4" />
                Rimanda
              </button>
            </div>
          </div>
        </div>
      )}

      {visible.length > 1 && (
        <div className="mt-3.5 flex justify-center gap-1.5">
          {visible.map((task, k) => (
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

function Chip({
  label,
  n,
  active,
  onClick,
}: {
  label: string;
  n: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-pill px-3 py-1.5 text-[12.5px] font-bold transition-colors",
        active
          ? "bg-ink text-on-ink"
          : "bg-card-2 text-text-2 hover:bg-line/60",
      )}
    >
      {label}
      <span className={cn("ml-1.5", active ? "text-on-ink/70" : "text-text-3")}>
        {n}
      </span>
    </button>
  );
}

function Vuoto({ messaggio }: { messaggio: string }) {
  return (
    <div className="mt-4 grid place-items-center rounded-md bg-paid-bg py-10 text-center">
      <CheckIcon className="size-8 text-paid-tx" />
      <p className="mt-2 text-sm font-bold text-paid-tx">Tutto in regola</p>
      <p className="text-[13px] text-paid-tx/80">{messaggio}</p>
    </div>
  );
}

function TaskIcon({ icon, className }: { icon: HomeIcon; className?: string }) {
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
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

function SnoozeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 1.5M9 3l-3 2M15 3l3 2" />
    </svg>
  );
}
