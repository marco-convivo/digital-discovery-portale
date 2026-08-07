"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { ActionLink } from "@/components/internal/action-link";
import { eliminaPreventivo } from "@/app/(app)/vendite/clienti/[id]/actions";
import { euro, dataIt } from "@/lib/format";

const TONE: Record<string, Tone> = {
  bozza: "draft",
  inviato: "info",
  visto: "wait",
  accettato: "paid",
  rifiutato: "fail",
  scaduto: "fail",
};

const EDITABILI = ["bozza", "inviato", "visto"];

export interface PreventivoItem {
  id: string;
  numero: string | null;
  stato: string;
  importo_totale: number | null;
  public_token: string;
  created_at: string;
}

export function PreventiviList({
  quotes,
  isAdmin = false,
}: {
  quotes: PreventivoItem[];
  isAdmin?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (quotes.length === 0) {
    return <p className="text-sm text-text-3">Nessun preventivo ancora.</p>;
  }

  const visibili = expanded ? quotes : quotes.slice(0, 5);
  const restanti = quotes.length - 5;

  function elimina(q: PreventivoItem) {
    if (
      !window.confirm(
        `Eliminare definitivamente il preventivo ${q.numero ?? ""}? L'azione non è reversibile.`,
      )
    )
      return;
    setError(null);
    start(async () => {
      const res = await eliminaPreventivo(q.id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div>
      <ul className="flex flex-col divide-y divide-line">
        {visibili.map((q) => (
          <li key={q.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="font-semibold text-text">{q.numero ?? "—"}</div>
              <div className="text-[12.5px] text-text-3">
                {dataIt(q.created_at)} · {euro(q.importo_totale)}
              </div>
            </div>
            <div className="flex flex-none items-center gap-3">
              <StatusPill tone={TONE[q.stato] ?? "draft"}>{q.stato}</StatusPill>
              {EDITABILI.includes(q.stato) && (
                <Link
                  href={`/vendite/preventivi/${q.id}`}
                  className="text-[13px] font-semibold text-violet hover:underline"
                >
                  Modifica
                </Link>
              )}
              <ActionLink
                href={`/preventivo/${q.public_token}`}
                label="Link cliente"
                icon="link"
              />
              {isAdmin && q.stato !== "accettato" && (
                <button
                  type="button"
                  onClick={() => elimina(q)}
                  disabled={pending}
                  className="text-[13px] font-semibold text-text-3 transition-colors hover:text-fail-tx disabled:opacity-50"
                >
                  Elimina
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-2 rounded-sm bg-fail-bg px-3 py-2 text-[13px] text-fail-tx">
          {error}
        </p>
      )}

      {quotes.length > 5 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-[13px] font-semibold text-text-2 hover:text-text"
        >
          {expanded ? "Mostra meno" : `Mostra altri ${restanti}`}
        </button>
      )}
    </div>
  );
}
