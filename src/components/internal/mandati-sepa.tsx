"use client";

import { useState } from "react";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { dataIt } from "@/lib/format";
import type { MandatoSepaRow } from "@/lib/clienti/scheda";

/** Raggruppa l'IBAN in blocchi di 4 per leggibilità. */
function formattaIban(iban: string): string {
  return (iban || "").replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}

/** Versione mascherata: primi 4 + ultimi 4, il resto in pallini. */
function mascheraIban(iban: string): string {
  const raw = (iban || "").replace(/\s+/g, "");
  if (raw.length <= 8) return formattaIban(raw);
  const mid = "•".repeat(raw.length - 8);
  return formattaIban(raw.slice(0, 4) + mid + raw.slice(-4));
}

const STATO_MANDATO: Record<string, { tone: Tone; label: string }> = {
  attivo: { tone: "paid", label: "Attivo" },
  registrato: { tone: "info", label: "Registrato" },
  revocato: { tone: "fail", label: "Revocato" },
};

export function MandatiSepa({ mandati }: { mandati: MandatoSepaRow[] }) {
  if (mandati.length === 0) {
    return (
      <p className="text-sm text-text-3">
        Nessun mandato SEPA registrato. Il cliente lo compila dal flusso di
        pagamento (o dal link &ldquo;nuovo mandato&rdquo; negli insoluti).
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {mandati.map((m) => (
        <MandatoCard key={m.id} m={m} />
      ))}
    </div>
  );
}

function MandatoCard({ m }: { m: MandatoSepaRow }) {
  const [mostra, setMostra] = useState(false);
  const [copiato, setCopiato] = useState(false);
  const stato = STATO_MANDATO[m.stato] ?? { tone: "draft" as Tone, label: m.stato };
  const ibanRaw = (m.iban || "").replace(/\s+/g, "");

  function copia() {
    navigator.clipboard?.writeText(ibanRaw);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 1500);
  }

  return (
    <div className="rounded-md border border-line p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3">
            Mandato {m.riferimento}
            {m.quote?.numero ? ` · Rif. preventivo ${m.quote.numero}` : ""}
          </div>
          <div className="text-[14px] font-bold text-text">{m.intestatario}</div>
        </div>
        <StatusPill tone={stato.tone}>{stato.label}</StatusPill>
      </div>

      <div className="mt-3 flex flex-col gap-1 rounded-field bg-card-2 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-wide text-text-3">
            IBAN
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-[12px] font-bold text-link"
              onClick={() => setMostra((v) => !v)}
            >
              {mostra ? "Nascondi" : "Mostra"}
            </button>
            <button
              type="button"
              className="text-[12px] font-bold text-link"
              onClick={copia}
            >
              {copiato ? "Copiato ✓" : "Copia"}
            </button>
          </div>
        </div>
        <div className="tnum select-all break-all text-[14px] font-semibold tracking-tight text-text">
          {mostra ? formattaIban(ibanRaw) : mascheraIban(ibanRaw)}
        </div>
        {m.bic && (
          <div className="mt-1 text-[12px] text-text-3">
            BIC: <span className="font-semibold text-text-2">{m.bic}</span>
          </div>
        )}
      </div>

      <div className="mt-2 text-[12px] text-text-3">
        Registrato il {dataIt(m.created_at)} · dato riservato allo staff (SDD).
      </div>
    </div>
  );
}
