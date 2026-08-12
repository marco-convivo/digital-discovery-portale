import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { AnagraficaEditor } from "@/components/internal/anagrafica-editor";
import { InviaAccessoButton } from "@/components/internal/invia-accesso-button";
import { PreventiviList } from "@/components/internal/preventivi-list";
import { PianiCliente } from "@/components/internal/piani-cliente";
import { FattureCliente } from "@/components/internal/fatture-cliente";
import { AllegatiCliente } from "@/components/internal/allegati-cliente";
import { AttivitaLog } from "@/components/internal/attivita-log";
import { ActionLink } from "@/components/internal/action-link";
import { STATO_META, contractMeta } from "@/lib/stati";
import { scadenzeServizi, labelScadenza, giorniAllaScadenza } from "@/lib/servizi";
import { cn } from "@/lib/utils";
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

  // Servizi attivi: dai contratti in corso (firmato/completato) → ordine → servizi,
  // filtrati per PERIODO. Un ricorrente scaduto (firma + durata < oggi) non è più
  // attivo; se un servizio è rinnovato in un contratto più recente, vince la
  // scadenza più avanti.
  // Fine del piano per contratto (ultima rata): dà una scadenza anche ai servizi
  // una tantum, che di per sé non ne hanno.
  const finePiano = new Map<string, string>();
  for (const g of gruppiPagamenti) {
    const max = g.rate.reduce(
      (m, r) => (r.scadenza && r.scadenza > m ? r.scadenza : m),
      "",
    );
    if (max) finePiano.set(g.key, max);
  }

  type ServizioAttivo = { label: string; scadenzaIso: string | null; unaTantum: boolean };
  const perLabel = new Map<string, ServizioAttivo>();
  for (const ct of contratti) {
    if (ct.stato !== "firmato" && ct.stato !== "completato") continue;
    const servizi = scadenzeServizi(ct.quote?.ordine ?? null, ct.signed_at);
    // Scadenza del contratto = la più lontana tra le scadenze dei ricorrenti e
    // la fine del piano rate.
    const cand = servizi
      .filter((s) => !s.unaTantum && s.scadenzaIso)
      .map((s) => s.scadenzaIso!)
      .concat(finePiano.get(ct.id) ? [finePiano.get(ct.id)!] : []);
    const contrattoScadenza = cand.length ? cand.sort().at(-1)! : null;
    for (const s of servizi) {
      // il ricorrente usa la sua scadenza; la una tantum eredita quella del contratto.
      const scadenzaIso = s.unaTantum ? contrattoScadenza : s.scadenzaIso;
      const cur = perLabel.get(s.label);
      if (!cur || (scadenzaIso ?? "") > (cur.scadenzaIso ?? ""))
        perLabel.set(s.label, { label: s.label, scadenzaIso, unaTantum: s.unaTantum });
    }
  }
  let serviziScaduti = 0;
  const serviziAttivi = [...perLabel.values()].flatMap((s) => {
    if (s.scadenzaIso && giorniAllaScadenza(s.scadenzaIso) < 0) {
      serviziScaduti++;
      return [];
    }
    const gg = s.scadenzaIso ? giorniAllaScadenza(s.scadenzaIso) : null;
    const inScadenza = gg != null && gg <= 30;
    const meta = s.scadenzaIso
      ? inScadenza
        ? `in scadenza · ${gg} gg`
        : `fino al ${dataIt(s.scadenzaIso)}`
      : "una tantum";
    return [{ label: s.label, meta, inScadenza }];
  });

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
          {serviziAttivi.length === 0 ? (
            <p className="text-sm text-text-3">
              {serviziScaduti > 0
                ? "Nessun servizio attivo: i contratti sono scaduti."
                : "Nessun servizio attivo: compaiono qui alla firma del contratto."}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {serviziAttivi.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-md border border-line px-3 py-2"
                >
                  <span
                    className={cn(
                      "size-1.5 flex-none rounded-full",
                      s.inScadenza ? "bg-wait-dot" : "bg-paid-dot",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
                    {s.label}
                  </span>
                  <span
                    className={cn(
                      "flex-none text-[12px]",
                      s.inScadenza ? "font-semibold text-wait-tx" : "text-text-3",
                    )}
                  >
                    {s.meta}
                  </span>
                </div>
              ))}
            </div>
          )}
          {serviziScaduti > 0 && (
            <p className="mt-2.5 text-[12px] text-text-3">
              {serviziScaduti}{" "}
              {serviziScaduti === 1 ? "servizio scaduto" : "servizi scaduti"} non
              più attivi (contratto da rinnovare).
            </p>
          )}
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

        {/* Piano pagamenti | Contratti — 50/50 */}
        <div className="grid items-start gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Piano pagamenti</CardTitle>
              <Link
                href={`/vendite/pagamenti/piani?cliente=${c.id}`}
                className="text-[13px] font-semibold text-link hover:underline"
              >
                Apri →
              </Link>
            </CardHeader>
            <PianiCliente piani={gruppiPagamenti} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contratti</CardTitle>
              <Link
                href={`/vendite/contratti?cliente=${c.id}`}
                className="text-[13px] font-semibold text-violet hover:underline"
              >
                Apri →
              </Link>
            </CardHeader>
            {contratti.length === 0 ? (
              <p className="text-sm text-text-3">Nessun contratto ancora.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {contratti.map((ct) => {
                  const servizi = scadenzeServizi(ct.quote?.ordine ?? null, ct.signed_at);
                  return (
                    <div key={ct.id} className="rounded-md border border-line p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[13px] font-semibold text-text">
                          {ct.signed_at
                            ? `Firmato il ${dataIt(ct.signed_at)}`
                            : `Creato ${dataIt(ct.created_at)}`}
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusPill tone={contractMeta(ct.stato).tone}>
                            {contractMeta(ct.stato).label}
                          </StatusPill>
                          {ct.signed_pdf_url && (
                            <ActionLink href={ct.signed_pdf_url} label="PDF firmato" icon="pdf" />
                          )}
                        </div>
                      </div>
                      {servizi.length > 0 && (
                        <ul className="mt-2.5 flex flex-col gap-1 border-t border-line pt-2.5">
                          {servizi.map((s, i) => (
                            <li
                              key={i}
                              className="flex items-baseline justify-between gap-2 text-[12.5px]"
                            >
                              <span className="min-w-0 truncate text-text-2">{s.label}</span>
                              <span className="flex-none text-text-3">{labelScadenza(s)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Preventivi | Fatture — 50/50 */}
        <div className="grid items-start gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Preventivi inviati</CardTitle>
              <Link
                href={`/vendite/preventivi?cliente=${c.id}`}
                className="text-[13px] font-semibold text-violet hover:underline"
              >
                Apri →
              </Link>
            </CardHeader>
            <PreventiviList quotes={quotes} isAdmin={isAdmin} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fatture</CardTitle>
            </CardHeader>
            <FattureCliente clientId={c.id} fatture={fatture} />
          </Card>
        </div>

        {/* Allegati interni (Visura + liberi) — solo staff */}
        <Card>
          <CardHeader>
            <CardTitle>Allegati</CardTitle>
            <span className="text-[12px] font-medium text-text-3">
              Documenti interni · non visibili al cliente
            </span>
          </CardHeader>
          <AllegatiCliente clientId={c.id} allegati={allegati} />
        </Card>
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
