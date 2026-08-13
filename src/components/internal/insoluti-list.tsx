"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  azioneGeneraLink,
  azioneInviaLinkEmail,
  azioneSegnaPagato,
  azioneAnnulla,
  azioneNuovoMandato,
} from "@/lib/insoluti/actions";
import { euro, dataIt, conIva } from "@/lib/format";
import { BONIFICO, IBAN_FALLBACK } from "@/lib/bonifico/config";
import { Button } from "@/components/ui/button";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import type { InsolutoRow } from "@/lib/insoluti/queries";
import type { AppSettings } from "@/lib/settings/app-settings";

const RECOVERY: Record<string, { tone: Tone; label: string }> = {
  da_recuperare: { tone: "wait", label: "Da recuperare" },
  link_inviato: { tone: "info", label: "Link inviato" },
  nuovo_mandato: { tone: "info", label: "Nuovo mandato" },
  bonifico_in_verifica: { tone: "wait", label: "Bonifico da verificare" },
};

function LinkCopiabile({
  url,
  copiato,
  onCopia,
}: {
  url: string;
  copiato: boolean;
  onCopia: () => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-field bg-card-2 px-3 py-2">
      <input
        readOnly
        value={url}
        className="min-w-0 flex-1 bg-transparent text-[12px] text-text-2 outline-none"
      />
      <button
        type="button"
        className="flex-none text-[12px] font-bold text-link"
        onClick={onCopia}
      >
        {copiato ? "Copiato ✓" : "Copia"}
      </button>
    </div>
  );
}

function Riga({
  r,
  settings,
  highlight,
}: {
  r: InsolutoRow;
  settings: AppSettings;
  highlight: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(r.recovery_url);
  const [mandatoUrl, setMandatoUrl] = useState<string | null>(null);
  const [bonifico, setBonifico] = useState(false);
  const [copiato, setCopiato] = useState<string | null>(null);

  const magg = Number(r.maggiorazione ?? settings.maggiorazione_insoluto ?? 0);
  const netto = Number(r.importo ?? 0);
  const lordo = conIva(netto + magg); // (rata + insoluto) × 1,22
  const rec = RECOVERY[r.recovery_stato] ?? { tone: "fail" as Tone, label: r.recovery_stato };

  const iban = settings.iban_bonifico ?? IBAN_FALLBACK;
  const causale = `Rata ${r.numero_rata ?? ""} · ${r.client?.ragione_sociale ?? ""}`.trim();
  const bonificoText =
    `Intestatario: ${BONIFICO.intestatario}\n` +
    `IBAN: ${iban}\n` +
    `Banca: ${BONIFICO.banca}\n` +
    `Importo: ${euro(lordo)} (IVA inclusa)\n` +
    `Causale: ${causale}`;

  function esegui(
    p: Promise<{ ok: true; url?: string } | { ok: false; error: string }>,
    opts?: { okMsg?: string; onUrl?: (u: string) => void },
  ) {
    setError(null);
    setMsg(null);
    start(async () => {
      const res = await p;
      if (!res.ok) return setError(res.error);
      if ("url" in res && res.url) opts?.onUrl?.(res.url);
      if (opts?.okMsg) setMsg(opts.okMsg);
      router.refresh();
    });
  }

  function copia(chiave: string, text: string) {
    navigator.clipboard?.writeText(text);
    setCopiato(chiave);
    setTimeout(() => setCopiato((c) => (c === chiave ? null : c)), 1500);
  }

  return (
    <div
      className={cn(
        "rounded-crm border bg-card p-5 shadow-card",
        highlight ? "border-ink ring-2 ring-ink/15" : "border-line",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-text">
              {r.client?.ragione_sociale ?? "—"}
            </span>
            <StatusPill tone={rec.tone}>{rec.label}</StatusPill>
          </div>
          <div className="mt-0.5 text-[13px] text-text-2">
            Rata {r.numero_rata ?? "—"} · {r.failure_reason ?? "Addebito non riuscito."}
          </div>
          <div className="mt-0.5 text-[12px] text-text-3">
            {r.failed_at ? `Fallito il ${dataIt(r.failed_at)}` : "—"}
            {r.attempts > 1 ? ` · ${r.attempts} tentativi` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="tnum font-bold text-text">{euro(lordo)}</div>
          <div className="text-[11px] text-text-3">
            rata {euro(netto)} + insoluto {euro(magg)} · IVA inclusa
          </div>
        </div>
      </div>

      {/* Carta */}
      <div className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={pending}
            onClick={() => esegui(azioneGeneraLink(r.id), { onUrl: setUrl })}
          >
            {url ? "Rigenera link carta" : "Genera link carta"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => esegui(azioneInviaLinkEmail(r.id), { okMsg: "Email inviata al cliente." })}
          >
            Invia link via email
          </Button>
        </div>
        <p className="mt-1 text-[11.5px] text-text-3">
          Crea un link sicuro per far saldare la rata con carta (IVA inclusa):
          copialo e invialo, oppure invialo tu via email.
        </p>
        {url && (
          <LinkCopiabile
            url={url}
            copiato={copiato === "carta"}
            onCopia={() => copia("carta", url)}
          />
        )}
      </div>

      {/* Altri metodi */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setBonifico((v) => !v)}>
          {bonifico ? "Nascondi bonifico" : "Bonifico"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            esegui(azioneNuovoMandato(r.id), {
              okMsg: "Link nuovo mandato pronto. I dati e la data li vedrai alla registrazione del cliente.",
              onUrl: setMandatoUrl,
            })
          }
        >
          Nuovo mandato SEPA
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => esegui(azioneAnnulla(r.id))}>
          Rinuncia
        </Button>
      </div>

      {mandatoUrl && (
        <div className="mt-2">
          <p className="text-[12px] text-text-3">
            Link per il nuovo mandato SEPA (il cliente inserisce l&apos;IBAN;
            registrazione e data vengono salvate):
          </p>
          <LinkCopiabile
            url={mandatoUrl}
            copiato={copiato === "mandato"}
            onCopia={() => copia("mandato", mandatoUrl)}
          />
        </div>
      )}

      {bonifico && (
        <div className="mt-2 rounded-field border border-line bg-card-2/60 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-bold text-text">Dati per il bonifico</p>
            <button
              type="button"
              className="text-[12px] font-bold text-link"
              onClick={() => copia("bonifico", bonificoText)}
            >
              {copiato === "bonifico" ? "Copiato ✓" : "Copia dati"}
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-1 text-[12.5px] text-text-2">
            <span>Intestatario: <b className="text-text">{BONIFICO.intestatario}</b></span>
            <span>IBAN: <b className="text-text">{iban}</b></span>
            <span>Banca: <b className="text-text">{BONIFICO.banca}</b></span>
            <span>Importo: <b className="text-text">{euro(lordo)}</b> (IVA inclusa)</span>
            <span>Causale: <b className="text-text">{causale}</b></span>
          </div>
          <Button
            size="sm"
            className="mt-3"
            disabled={pending}
            onClick={() => esegui(azioneSegnaPagato(r.id), { okMsg: "Segnato come pagato." })}
          >
            Bonifico ricevuto → segna come pagato
          </Button>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-field bg-fail-bg px-3 py-1.5 text-[12.5px] text-fail-tx">
          {error}
        </p>
      )}
      {msg && (
        <p className="mt-2 rounded-field bg-mint-soft px-3 py-1.5 text-[12.5px] text-text">
          {msg}
        </p>
      )}
    </div>
  );
}

export function InsolutiList({
  insoluti,
  settings,
  highlightId,
}: {
  insoluti: InsolutoRow[];
  settings: AppSettings;
  highlightId?: string;
}) {
  if (insoluti.length === 0) {
    return (
      <div className="rounded-crm border border-line bg-card p-8 text-center">
        <p className="font-bold text-text">Nessun insoluto aperto 🎉</p>
        <p className="mt-1 text-sm text-text-2">
          Gli addebiti rifiutati compariranno qui con le azioni di recupero.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {insoluti.map((r) => (
        <Riga key={r.id} r={r} settings={settings} highlight={r.id === highlightId} />
      ))}
    </div>
  );
}
