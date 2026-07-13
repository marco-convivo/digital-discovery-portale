import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalClient } from "@/lib/portale/client";
import { getPortaleHomeData } from "@/lib/portale/home";
import { getVetrinaPubblica } from "@/lib/catalogo/queries";
import { ServiziCarosello } from "@/components/portale/servizi-carosello";
import { ServiziAttivi } from "@/components/portale/servizi-attivi";
import { euro, dataIt } from "@/lib/format";

const MAILTO = "mailto:info@digitaldiscovery.it";

export default async function PortaleHome() {
  const client = await getPortalClient();
  if (!client) redirect("/accedi");

  const data = await getPortaleHomeData(client.owner_id);
  const vetrina = await getVetrinaPubblica();
  const consigliati = vetrina.filter(
    (v) => !data.serviceKeysAttivi.includes(v.row.chiave),
  );

  const pct =
    data.rateTotali > 0
      ? Math.round((data.ratePagate / data.rateTotali) * 100)
      : 0;
  const nome = client.referente || client.ragione_sociale;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-balance text-text">
          Ciao, {nome} 👋
        </h1>
        <p className="mt-1 text-[15px] text-text-2">
          La tua presenza digitale, gestita da noi — sempre sotto controllo.
        </p>
      </header>

      {/* Prossimo addebito — pannello commerciale */}
      <section className="overflow-hidden rounded-card bg-ink p-6 text-on-ink shadow-card sm:p-7">
        <p className="text-[13px] font-semibold text-on-ink/60">
          Prossimo addebito
        </p>
        {data.prossimaRata ? (
          <>
            <div className="mt-1.5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold tracking-[-0.03em]">
                    {euro(data.prossimaRata.importo)}
                  </span>
                </div>
                <p className="mt-1 text-[14px] text-on-ink/70">
                  Rata {data.prossimaRata.numero_rata} · in scadenza il{" "}
                  {dataIt(data.prossimaRata.scadenza)}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-mint-soft px-3 py-1.5 text-[13px] font-bold text-on-mint">
                <span aria-hidden>✓</span> Addebito automatico SDD
              </span>
            </div>
            {/* progresso del piano */}
            <div className="mt-5 border-t border-on-ink/15 pt-4">
              <div className="flex items-center justify-between text-[13px] text-on-ink/70">
                <span>Piano pagamenti</span>
                <span className="tnum">
                  {data.ratePagate} di {data.rateTotali} rate
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-pill bg-on-ink/15">
                <div
                  className="h-full rounded-pill bg-mint"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="mt-2">
            <p className="text-xl font-extrabold">Tutto in regola ✨</p>
            <p className="mt-1 text-[14px] text-on-ink/70">
              Nessuna rata in scadenza. Ci pensiamo noi.
            </p>
          </div>
        )}
      </section>

      {/* Stat rapide */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          href="/portale/pagamenti"
          title="Piano pagamenti"
          value={`${pct}%`}
          sub={`${data.ratePagate}/${data.rateTotali} rate saldate`}
          progress={pct}
        />
        <StatCard
          href="/portale/servizi"
          title="Servizi attivi"
          value={String(data.serviziAttivi.length)}
          sub="gestiti da noi"
        />
        <StatCard
          href="/portale/contratti"
          title="Contratti"
          value={String(data.contrattiCount)}
          sub="firmati · documenti"
        />
      </section>

      {/* Servizi attivi */}
      {data.serviziAttivi.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[17px] font-bold tracking-[-0.01em] text-text">
              I tuoi servizi attivi
            </h2>
            <Link
              href="/portale/servizi"
              className="text-[13px] font-semibold text-violet hover:underline"
            >
              Vedi tutti →
            </Link>
          </div>
          <ServiziAttivi servizi={data.serviziAttivi.slice(0, 4)} />
        </section>
      )}

      {/* Cross-sell — vetrina in carosello */}
      {consigliati.length > 0 && (
        <section>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[17px] font-bold tracking-[-0.01em] text-text">
              Fai crescere la tua presenza
            </h2>
            <Link
              href="/portale/catalogo"
              className="text-[13px] font-semibold text-violet hover:underline"
            >
              Tutto il catalogo →
            </Link>
          </div>
          <p className="mb-3 text-[13.5px] text-text-2">
            Servizi pensati per il tuo business, attivabili con un contatto.
          </p>
          <ServiziCarosello servizi={consigliati} basePath="/portale/catalogo" />
        </section>
      )}

      {/* Customer care — referente dedicato */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-card border border-line/60 bg-card-2/60 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[16px] font-bold text-text">
            {data.referente
              ? `${data.referente} è il tuo referente dedicato`
              : "Hai un referente dedicato"}
          </h2>
          <p className="mt-1 max-w-[52ch] text-[13.5px] text-text-2">
            Un unico contatto per ogni esigenza: modifiche, nuove idee o
            semplici domande. Ti rispondiamo noi.
          </p>
        </div>
        <a
          href={MAILTO}
          className="flex-none rounded-pill bg-ink px-5 py-2.5 text-[14px] font-semibold text-on-ink transition-opacity hover:opacity-90"
        >
          Scrivici
        </a>
      </section>
    </div>
  );
}

function StatCard({
  href,
  title,
  value,
  sub,
  progress,
}: {
  href: string;
  title: string;
  value: string;
  sub: string;
  progress?: number;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-card border border-line/60 bg-card p-5 shadow-card transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-violet focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-violet/50"
    >
      <span className="text-[13px] font-semibold text-text-2">{title}</span>
      <span className="mt-1 text-2xl font-extrabold tracking-[-0.01em] text-text">
        {value}
      </span>
      <span className="text-[12.5px] text-text-3">{sub}</span>
      {progress != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-card-2">
          <div
            className="h-full rounded-pill bg-violet"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </Link>
  );
}
