import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { AnagraficaEditor } from "@/components/internal/anagrafica-editor";
import { InviaAccessoButton } from "@/components/internal/invia-accesso-button";
import { CreateQuoteForm } from "@/components/internal/create-quote-form";
import { PreventiviList } from "@/components/internal/preventivi-list";
import { PianiPagamento } from "@/components/internal/piani-pagamento";
import { FattureCliente } from "@/components/internal/fatture-cliente";
import { ActionLink } from "@/components/internal/action-link";
import { STATO_META } from "@/lib/stati";
import { scadenzeServizi, labelScadenza } from "@/lib/servizi";
import { dataIt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ClienteSchedaData } from "@/lib/clienti/scheda";
import type { ClientStato } from "@/lib/types";

const CONTRACT_TONE: Record<string, Tone> = {
  inviato: "info",
  firmato: "paid",
  annullato: "fail",
};

export function ClienteScheda({
  data,
  layout,
}: {
  data: ClienteSchedaData;
  layout: "page" | "drawer";
}) {
  const { client: c, prezziBase, quotes, contratti, fatture, gruppiPagamenti } =
    data;
  const meta = STATO_META[c.stato as ClientStato];

  const anagrafica = (
    <Card>
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
    </Card>
  );

  const pagamenti = (
    <Card>
      <CardHeader>
        <CardTitle>Piano pagamenti</CardTitle>
        <Link
          href={`/vendite/pagamenti?cliente=${c.id}`}
          className="text-[13px] font-semibold text-violet hover:underline"
        >
          Apri →
        </Link>
      </CardHeader>
      <PianiPagamento groups={gruppiPagamenti} />
    </Card>
  );

  const contrattiCard = (
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
                    <StatusPill tone={CONTRACT_TONE[ct.stato] ?? "draft"}>
                      {ct.stato}
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
  );

  const fattureCard = (
    <Card>
      <CardHeader>
        <CardTitle>Fatture</CardTitle>
      </CardHeader>
      <FattureCliente clientId={c.id} fatture={fatture} />
    </Card>
  );

  const nuovoPreventivo = (
    <Card>
      <CardHeader>
        <CardTitle>Nuovo preventivo</CardTitle>
      </CardHeader>
      <CreateQuoteForm clientId={c.id} prezziBase={prezziBase} />
    </Card>
  );

  const preventiviInviati = (
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
      <PreventiviList quotes={quotes} />
    </Card>
  );

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1
            className={cn(
              "font-extrabold tracking-[-0.02em] text-text",
              layout === "drawer" ? "text-xl" : "text-2xl",
            )}
          >
            {c.ragione_sociale}
          </h1>
          {c.referente && <p className="mt-0.5 text-sm text-text-2">{c.referente}</p>}
        </div>
        <div className="flex flex-none flex-col items-end gap-2">
          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          <InviaAccessoButton clientId={c.id} />
        </div>
      </header>

      {layout === "drawer" ? (
        <div className="flex flex-col gap-5">
          {anagrafica}
          {pagamenti}
          {contrattiCard}
          {fattureCard}
          {preventiviInviati}
          {nuovoPreventivo}
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-1">
            {anagrafica}
            {pagamenti}
            {contrattiCard}
            {fattureCard}
          </div>
          <div className="flex flex-col gap-5 lg:col-span-2">
            {nuovoPreventivo}
            {preventiviInviati}
          </div>
        </div>
      )}
    </div>
  );
}
