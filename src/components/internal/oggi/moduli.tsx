import Link from "next/link";
import { Card, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { StatusPill, TONE_DOT } from "@/components/ui/status-pill";
import { euro, dataBreve } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  CassaMese,
  PipelineSegnale,
  CodaItem,
  MovimentoRecente,
} from "@/lib/oggi/queries";

/* ---- Da chiudere ----------------------------------------------------------- */

export function DaChiudere({ items }: { items: CodaItem[] }) {
  const top = items.slice(0, 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Da chiudere</CardTitle>
        <CardAction href="/vendite/lavoro">Tutte le pratiche</CardAction>
      </CardHeader>
      {top.length === 0 ? (
        <p className="py-4 text-[13px] text-text-3">
          Niente di fermo. Tutto sotto controllo ✨
        </p>
      ) : (
        <div className="flex flex-col">
          {top.map((it) => (
            <Link
              key={it.key}
              href={it.azione.href}
              className="flex items-center gap-3 border-b border-line-soft py-2.5 last:border-b-0"
            >
              <span className={cn("size-1.5 flex-none rounded-full", TONE_DOT[it.tone])} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-text">
                  {it.ragioneSociale}
                </span>
                <span className="block truncate text-[12.5px] text-text-3">
                  {it.situazione}
                </span>
              </span>
              <span className="tnum flex-none text-[13.5px] font-bold text-text">
                {it.importo != null ? euro(it.importo) : "—"}
              </span>
              <span className="flex-none whitespace-nowrap rounded-pill border border-line-strong px-3 py-1 text-[12px] font-bold text-text">
                {it.azione.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---- Cassa del mese (blocco denaro scuro) ---------------------------------- */

export function CassaDelMese({ cassa }: { cassa: CassaMese }) {
  const parti = cassa.incassato + cassa.inArrivo + cassa.daRecuperare;
  const pct = (n: number) => (parti > 0 ? Math.round((n / parti) * 100) : 0);
  return (
    <div className="rounded-crm border border-[#2c2e31] bg-ink p-[18px] text-on-ink">
      <div className="mb-3 flex min-h-[22px] items-center justify-between gap-3">
        <span className="text-[13px] font-bold capitalize">
          Cassa di {cassa.meseLabel}
        </span>
        <span className="text-[12px] font-semibold text-on-ink/55">
          Vedi calendario
        </span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-[26px] font-extrabold leading-none tracking-[-0.02em]">
          {euro(cassa.incassato)}
        </span>
        <span className="mb-0.5 text-[14px] font-semibold text-on-ink/70">
          incassati
        </span>
      </div>
      <div className="mt-1.5 text-[12px] text-on-ink/55">
        su {euro(cassa.previsto)} previsti
        {cassa.rateFerme > 0 && ` · ${cassa.rateFerme} rate ferme`}
      </div>

      <div className="mt-3.5 flex h-2 gap-[3px] overflow-hidden rounded-pill">
        <span style={{ width: `${pct(cassa.incassato)}%` }} className="bg-mint" />
        <span style={{ width: `${pct(cassa.inArrivo)}%` }} className="bg-on-ink/20" />
        <span style={{ width: `${pct(cassa.daRecuperare)}%` }} className="bg-fail-dot" />
      </div>

      <div className="mt-3 flex flex-col gap-1.5 border-t border-[#2c2e31] pt-3 text-[13px]">
        <Riga label="Incassato" value={euro(cassa.incassato)} tone="mint" />
        <Riga label="In arrivo entro fine mese" value={euro(cassa.inArrivo)} />
        <Riga label="Da recuperare" value={euro(cassa.daRecuperare)} tone="fail" />
      </div>
    </div>
  );
}

function Riga({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "mint" | "fail";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-on-ink/60">{label}</span>
      <span
        className={cn(
          "font-semibold",
          tone === "mint" ? "text-mint" : tone === "fail" ? "text-[#fbe0de]" : "text-on-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ---- Pipeline ridotta a segnale -------------------------------------------- */

export function PipelineSegnaleModulo({ seg }: { seg: PipelineSegnale }) {
  const max = Math.max(1, ...seg.colonne.map((c) => c.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline</CardTitle>
        <CardAction href="/vendite/pipeline">Apri board</CardAction>
      </CardHeader>
      <div className="flex flex-col gap-2.5">
        {seg.colonne.map((c) => (
          <div key={c.key}>
            <div className="flex items-center justify-between text-[12.5px] font-semibold text-text-2">
              <span>{c.label}</span>
              <span className="tnum">{c.count}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-line-soft">
              <div
                className={cn("h-full rounded-pill", TONE_DOT[c.tone])}
                style={{ width: `${Math.round((c.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {seg.fermiCount > 0 && (
        <Link
          href="/vendite/pipeline?fermi=1"
          className="mt-3 flex items-center gap-2 rounded-md bg-wait-bg px-3 py-2 text-[12.5px] font-semibold text-wait-tx"
        >
          <span className="size-1.5 rounded-full bg-wait-dot" />
          {seg.fermiCount} trattative ferme da 14+ giorni
        </Link>
      )}
    </Card>
  );
}

/* ---- Movimenti recenti ----------------------------------------------------- */

export function MovimentiRecenti({ movimenti }: { movimenti: MovimentoRecente[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimenti recenti</CardTitle>
        <CardAction href="/vendite/clienti">Tutti i clienti</CardAction>
      </CardHeader>
      {movimenti.length === 0 ? (
        <p className="py-4 text-[13px] text-text-3">Ancora nessun movimento.</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-line">
          <div className="grid grid-cols-[2fr_3fr_1.4fr_1fr] bg-card-2 px-4 py-2 text-[12px] font-semibold text-text-2">
            <span>Cliente</span>
            <span>Cosa è successo</span>
            <span>Stato</span>
            <span className="text-right">Quando</span>
          </div>
          {movimenti.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[2fr_3fr_1.4fr_1fr] items-center border-t border-line-soft px-4 py-2.5 text-[13px]"
            >
              <span className="truncate font-bold text-text">{m.ragioneSociale}</span>
              <span className="truncate text-text-2">{m.cosa}</span>
              <span>
                {m.aStato && <StatusPill tone={m.tone}>{m.aStato}</StatusPill>}
              </span>
              <span className="text-right text-text-3">{dataBreve(m.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
