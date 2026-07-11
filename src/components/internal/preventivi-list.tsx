"use client";

import { useState } from "react";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { ActionLink } from "@/components/internal/action-link";
import { euro, dataIt } from "@/lib/format";

const TONE: Record<string, Tone> = {
  bozza: "draft",
  inviato: "info",
  visto: "wait",
  accettato: "paid",
  rifiutato: "fail",
  scaduto: "fail",
};

export interface PreventivoItem {
  id: string;
  numero: string | null;
  stato: string;
  importo_totale: number | null;
  public_token: string;
  created_at: string;
}

export function PreventiviList({ quotes }: { quotes: PreventivoItem[] }) {
  const [expanded, setExpanded] = useState(false);

  if (quotes.length === 0) {
    return <p className="text-sm text-text-3">Nessun preventivo ancora.</p>;
  }

  const visibili = expanded ? quotes : quotes.slice(0, 5);
  const restanti = quotes.length - 5;

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
              <ActionLink
                href={`/preventivo/${q.public_token}`}
                label="Link cliente"
                icon="link"
              />
            </div>
          </li>
        ))}
      </ul>

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
