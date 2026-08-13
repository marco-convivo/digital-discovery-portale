"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/ui/status-pill";
import { eliminaPreventivo } from "@/app/(app)/vendite/clienti/[id]/actions";
import { euro, dataIt } from "@/lib/format";
import { quoteMeta } from "@/lib/stati";

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
  const [copiato, setCopiato] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function copiaLink(q: PreventivoItem) {
    navigator.clipboard.writeText(`${location.origin}/preventivo/${q.public_token}`);
    setCopiato(q.id);
    setTimeout(() => setCopiato((c) => (c === q.id ? null : c)), 1500);
  }

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
              <StatusPill tone={quoteMeta(q.stato).tone}>{quoteMeta(q.stato).label}</StatusPill>
              {EDITABILI.includes(q.stato) && (
                <Link
                  href={`/vendite/preventivi/${q.id}`}
                  className="text-[13px] font-semibold text-violet hover:underline"
                >
                  Modifica
                </Link>
              )}
              <button
                type="button"
                onClick={() =>
                  window.open(`/preventivo/${q.public_token}`, "_blank", "noopener")
                }
                className="text-[13px] font-semibold text-link hover:underline"
              >
                Anteprima
              </button>
              <button
                type="button"
                onClick={() => copiaLink(q)}
                className="text-[13px] font-semibold text-text-2 transition-colors hover:text-text"
              >
                {copiato === q.id ? "Copiato ✓" : "Copia link"}
              </button>
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
