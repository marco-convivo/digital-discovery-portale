import Link from "next/link";
import { getCassaMese } from "@/lib/oggi/queries";
import { getCalendarioCassa } from "@/lib/cassa/queries";
import { countInsolutiAperti } from "@/lib/insoluti/queries";
import { CassaShell } from "@/components/internal/cassa-shell";
import { CassaDelMese } from "@/components/internal/oggi/moduli";
import { StatusPill } from "@/components/ui/status-pill";
import { PAYMENT_STATO_META } from "@/lib/stati";
import { euro, dataBreve } from "@/lib/format";
import { cn } from "@/lib/utils";

// Cassa · Calendario: le rate attese per finestra temporale + il denaro del mese.
export default async function CalendarioCassaPage() {
  const [cassa, buckets, insolutiCount] = await Promise.all([
    getCassaMese(),
    getCalendarioCassa(),
    countInsolutiAperti(),
  ]);

  return (
    <CassaShell active="calendario" insolutiCount={insolutiCount}>
      {insolutiCount > 0 && (
        <Link
          href="/vendite/insoluti"
          className="mb-4 flex items-center gap-2.5 rounded-crm border border-fail-dot bg-fail-bg px-4 py-3 text-[13.5px] font-semibold text-fail-tx"
        >
          <span className="size-1.5 rounded-full bg-fail-dot" />
          {insolutiCount} {insolutiCount === 1 ? "addebito da recuperare" : "addebiti da recuperare"} — vai agli insoluti →
        </Link>
      )}

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          {buckets.length === 0 ? (
            <div className="rounded-crm border border-line bg-card p-8 text-center">
              <p className="text-[15px] font-bold text-text">Nessuna rata in arrivo</p>
              <p className="mt-1 text-[13px] text-text-2">
                Le rate programmate compaiono qui, dalla più vicina.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-crm border border-line bg-card">
              {buckets.map((b) => (
                <div key={b.key}>
                  <div
                    className={cn(
                      "flex items-center justify-between border-b border-line bg-card-2 px-4 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide",
                      b.ritardo ? "text-fail-tx" : "text-text-2",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {b.ritardo && <span className="size-1.5 rounded-full bg-fail-dot" />}
                      {b.label} · {b.items.length}
                    </span>
                    <span className="tnum normal-case">{euro(b.totale)}</span>
                  </div>
                  {b.items.map((r) => {
                    const meta = PAYMENT_STATO_META[r.stato];
                    return (
                      <Link
                        key={r.id}
                        href={`/vendite/clienti/${r.clientId}`}
                        className="grid grid-cols-[2.4fr_1fr_1.2fr_1.2fr] items-center border-b border-line-soft px-4 py-2.5 text-[13px] last:border-b-0 hover:bg-card-2"
                      >
                        <span className="truncate font-bold text-text">
                          {r.ragioneSociale}
                        </span>
                        <span className="text-text-3">Rata {r.numeroRata ?? "—"}</span>
                        <span className="tnum font-bold text-text">{euro(r.importo)}</span>
                        <span className="flex items-center justify-end gap-2.5">
                          <span className="text-text-3">{dataBreve(r.scadenza)}</span>
                          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="col-span-12 lg:col-span-4">
          <CassaDelMese cassa={cassa} />
        </div>
      </div>
    </CassaShell>
  );
}
