import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { AnagraficaEditor } from "@/components/internal/anagrafica-editor";
import { InviaAccessoButton } from "@/components/internal/invia-accesso-button";
import { AttivitaLog } from "@/components/internal/attivita-log";
import { ServiziAttiviCliente } from "@/components/internal/servizi-attivi-cliente";
import { SchedaDettagli } from "@/components/internal/scheda-dettagli";
import { STATO_META } from "@/lib/stati";
import { dataIt, euro } from "@/lib/format";
import type { ClienteSchedaData } from "@/lib/clienti/scheda";
import type { ClientStato } from "@/lib/types";

export function ClienteScheda({ data }: { data: ClienteSchedaData }) {
  const {
    client: c,
    quotes,
    contratti,
    fatture,
    gruppiPagamenti,
    attivita,
    allegati,
    serviziAttivi,
    isAdmin,
  } = data;
  const stato = c.stato as ClientStato;
  const meta = STATO_META[stato];

  // Sintesi rate (per la striscia "a colpo d'occhio").
  const rate = gruppiPagamenti.flatMap((g) => g.rate);
  const pagate = rate.filter((r) => r.stato === "paid").length;
  const prossima =
    rate
      .filter((r) => r.stato === "scheduled" || r.stato === "pending")
      .sort((a, b) => (a.scadenza ?? "").localeCompare(b.scadenza ?? ""))[0] ?? null;

  const prossimoPasso = (() => {
    switch (stato) {
      case "lead":
        return "Crea e invia un preventivo";
      case "in_trattativa":
        if (quotes.some((q) => q.stato === "accettato"))
          return "Preventivo accettato — invia il contratto";
        if (quotes.some((q) => q.stato === "inviato" || q.stato === "visto"))
          return "In attesa che il cliente accetti";
        return "Prepara e invia il preventivo";
      case "in_attivazione":
        if (contratti.some((ct) => ct.stato === "firmato") && rate.length === 0)
          return "Contratto firmato — imposta il pagamento";
        if (contratti.some((ct) => ct.stato === "inviato"))
          return "In attesa di firma del contratto";
        return "In attivazione";
      case "attivo":
        return prossima
          ? `Prossima rata il ${dataIt(prossima.scadenza)}`
          : "Cliente attivo, tutto in regola";
      case "perso":
        return "Trattativa persa";
      case "cessato":
        return "Cliente cessato";
      default:
        return meta.label;
    }
  })();

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-[-0.02em] text-text">
            {c.ragione_sociale}
          </h1>
          {c.referente && <p className="mt-0.5 text-sm text-text-2">{c.referente}</p>}
        </div>
        <div className="flex flex-none items-center gap-2">
          <Link
            href={`/vendite/preventivo/${c.id}`}
            className="inline-flex items-center gap-1.5 rounded-btn bg-ink px-4 py-2 text-[13.5px] font-semibold text-on-ink transition-opacity hover:opacity-90"
          >
            + Nuovo preventivo
          </Link>
          <InviaAccessoButton clientId={c.id} />
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="flex min-w-0 flex-col gap-5">
        {/* Stato pratica: a colpo d'occhio, dove siamo e cosa fare adesso */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div className="flex items-center gap-3.5">
              <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
              <div>
                <div className="text-[12px] font-medium text-text-3">
                  Prossimo passo
                </div>
                <div className="text-[15px] font-bold text-text">
                  {prossimoPasso}
                </div>
              </div>
            </div>
            {rate.length > 0 && (
              <div className="flex items-center gap-8">
                {prossima && (
                  <div>
                    <div className="text-[12px] font-medium text-text-3">
                      Prossima rata
                    </div>
                    <div className="tnum text-[15px] font-bold text-text">
                      {euro(prossima.importo)}
                      <span className="ml-1.5 text-[12.5px] font-medium text-text-3">
                        {dataIt(prossima.scadenza)}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[12px] font-medium text-text-3">Piano</div>
                  <div className="tnum text-[15px] font-bold text-text">
                    {pagate}/{rate.length}
                    <span className="ml-1.5 text-[12.5px] font-medium text-text-3">
                      rate saldate
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Servizi attivi: cosa ha il cliente, dai contratti in corso */}
        <Card>
          <CardHeader>
            <CardTitle>Servizi attivi</CardTitle>
            {serviziAttivi.length > 0 && (
              <span className="text-[12px] font-medium text-text-3">
                {serviziAttivi.length} in corso
              </span>
            )}
          </CardHeader>
          <ServiziAttiviCliente servizi={serviziAttivi} />
        </Card>

        {/* Anagrafica: collassabile, per ridurre l'ingombro */}
        <Card>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <CardTitle>Anagrafica e fatturazione</CardTitle>
              <span className="text-[12px] font-medium text-text-3">
                <span className="truncate">{c.email ?? c.p_iva ?? c.referente ?? "—"}</span>
                <span className="ml-2 group-open:hidden">apri ▾</span>
                <span className="ml-2 hidden group-open:inline">chiudi ▴</span>
              </span>
            </summary>
            <div className="mt-4">
              <AnagraficaEditor
                clientId={c.id}
                initial={{
                  ragione_sociale: c.ragione_sociale,
                  referente: c.referente,
                  email: c.email,
                  telefono: c.telefono,
                  p_iva: c.p_iva,
                  codice_fiscale: c.codice_fiscale,
                  codice_sdi: c.codice_sdi,
                  pec: c.pec,
                  indirizzo: c.indirizzo,
                }}
              />
            </div>
          </details>
        </Card>

        {/* Dettagli a tab: Piano · Contratti · Preventivi · Fatture · Allegati */}
        <SchedaDettagli
          clientId={c.id}
          piani={gruppiPagamenti}
          contratti={contratti}
          quotes={quotes}
          fatture={fatture}
          allegati={allegati}
          isAdmin={isAdmin}
        />
        </div>

        {/* Cronologia: colonna destra verticale e scrollabile */}
        <Card className="xl:sticky xl:top-4">
          <CardHeader>
            <CardTitle>Cronologia</CardTitle>
          </CardHeader>
          <div className="no-scrollbar max-h-[72vh] overflow-y-auto">
            <AttivitaLog attivita={attivita} />
          </div>
        </Card>
      </div>
    </div>
  );
}
