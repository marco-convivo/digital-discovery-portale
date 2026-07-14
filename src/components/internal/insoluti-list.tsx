"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  azioneGeneraLink,
  azioneInviaLinkEmail,
  azioneSegnaPagato,
  azioneAnnulla,
  azioneRitentaSepa,
  azioneNuovoMandato,
} from "@/lib/insoluti/actions";
import { euro, dataIt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import type { InsolutoRow } from "@/lib/insoluti/queries";
import type { AppSettings } from "@/lib/settings/app-settings";

const RECOVERY: Record<string, { tone: Tone; label: string }> = {
  da_recuperare: { tone: "wait", label: "Da recuperare" },
  link_inviato: { tone: "info", label: "Link inviato" },
  nuovo_mandato: { tone: "info", label: "Nuovo mandato" },
  bonifico_in_verifica: { tone: "wait", label: "Bonifico da verificare" },
};

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
  const [bonifico, setBonifico] = useState(false);

  const magg = Number(r.maggiorazione ?? settings.maggiorazione_insoluto ?? 0);
  const netto = Number(r.importo ?? 0);
  const rec = RECOVERY[r.recovery_stato] ?? { tone: "fail" as Tone, label: r.recovery_stato };

  function run(
    p: Promise<{ ok: true; url?: string } | { ok: false; error: string }>,
    okMsg?: string,
  ) {
    setError(null);
    setMsg(null);
    start(async () => {
      const res = await p;
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if ("url" in res && res.url) setUrl(res.url);
      if (okMsg) setMsg(okMsg);
      router.refresh();
    });
  }

  return (
    <div
      className={cnHighlight(highlight)}
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
            {r.failure_code ? ` · ${r.failure_code}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-text tnum">{euro(netto + magg)}</div>
          <div className="text-[11px] text-text-3">
            rata {euro(netto)} + insoluto {euro(magg)}
          </div>
          <div className="text-[10.5px] text-text-3">IVA inclusa al pagamento</div>
        </div>
      </div>

      {/* Azioni */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(azioneGeneraLink(r.id))}
        >
          {url ? "Rigenera link carta" : "Genera link carta"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => run(azioneInviaLinkEmail(r.id), "Email inviata al cliente.")}
        >
          Invia link via email
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => setBonifico((v) => !v)}
        >
          Bonifico
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => run(azioneRitentaSepa(r.id), "Addebito SEPA ritentato.")}
        >
          Ritenta SEPA
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            run(azioneNuovoMandato(r.id), "Richiesta nuovo mandato inviata al cliente.")
          }
        >
          Nuovo mandato
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => run(azioneAnnulla(r.id))}
        >
          Annulla
        </Button>
      </div>

      {url && (
        <div className="mt-2 flex items-center gap-2 rounded-sm bg-card-2 px-3 py-2">
          <input
            readOnly
            value={url}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-text-2 outline-none"
          />
          <button
            type="button"
            className="text-[12px] font-semibold text-violet"
            onClick={() => navigator.clipboard?.writeText(url)}
          >
            Copia
          </button>
        </div>
      )}

      {bonifico && (
        <div className="mt-2 rounded-sm border border-line bg-card-2/60 p-3 text-[12.5px] text-text-2">
          <p className="font-semibold text-text">Pagamento con bonifico</p>
          <p className="mt-1">
            IBAN: <b>{settings.iban_bonifico ?? "— (da impostare)"}</b>
            <br />
            Causale: {settings.causale_bonifico ?? "—"} · rata {r.numero_rata ?? ""}
            <br />
            Importo: <b>{euro(netto + magg)}</b> (+ IVA come da fattura)
          </p>
          <Button
            size="sm"
            className="mt-2"
            disabled={pending}
            onClick={() => run(azioneSegnaPagato(r.id), "Segnato come pagato.")}
          >
            Bonifico ricevuto → segna pagato
          </Button>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-sm bg-fail-bg px-3 py-1.5 text-[12.5px] text-fail-tx">
          {error}
        </p>
      )}
      {msg && (
        <p className="mt-2 rounded-sm bg-mint-soft px-3 py-1.5 text-[12.5px] text-text">
          {msg}
        </p>
      )}
    </div>
  );
}

function cnHighlight(highlight: boolean) {
  return [
    "rounded-card border bg-card p-5 shadow-card",
    highlight ? "border-violet ring-2 ring-violet/30" : "border-line/60",
  ].join(" ");
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
      <div className="rounded-card border border-line/60 bg-card p-8 text-center">
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
        <Riga
          key={r.id}
          r={r}
          settings={settings}
          highlight={r.id === highlightId}
        />
      ))}
    </div>
  );
}
