import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { AnagraficaEditor } from "@/components/internal/anagrafica-editor";
import { CreateQuoteForm } from "@/components/internal/create-quote-form";
import { PreventiviList, type PreventivoItem } from "@/components/internal/preventivi-list";
import { type RataRow } from "@/components/internal/piano-pagamenti";
import { PianiPagamento } from "@/components/internal/piani-pagamento";
import { ActionLink } from "@/components/internal/action-link";
import { STATO_META } from "@/lib/stati";
import { getPrezziBase } from "@/lib/catalogo/queries";
import { scadenzeServizi, labelScadenza } from "@/lib/servizi";
import { dataIt } from "@/lib/format";
import type { OrdineSelezione } from "@/lib/catalog";
import type { Client, ClientStato } from "@/lib/types";

const CONTRACT_TONE: Record<string, Tone> = {
  inviato: "info",
  firmato: "paid",
  annullato: "fail",
};

interface ContractRow {
  id: string;
  stato: string;
  signed_at: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  quote: { ordine: OrdineSelezione | null } | null;
}

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!client) notFound();
  const c = client as Client;
  const meta = STATO_META[c.stato as ClientStato];

  const prezziBase = await getPrezziBase();

  const [{ data: quotesData }, { data: payData }, { data: contrData }] =
    await Promise.all([
      supabase
        .from("quotes")
        .select("id, numero, stato, importo_totale, public_token, created_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("numero_rata, importo, scadenza, stato, contract_id")
        .eq("client_id", id)
        .order("numero_rata", { ascending: true }),
      supabase
        .from("contracts")
        .select(
          "id, stato, signed_at, signed_pdf_url, created_at, quote:quotes!contracts_quote_id_fkey(ordine)",
        )
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const quotes = (quotesData ?? []) as unknown as PreventivoItem[];
  const contratti = (contrData ?? []) as unknown as ContractRow[];

  // Raggruppa le rate per contratto (più contratti = più piani distinti).
  const pays = (payData ?? []) as unknown as (RataRow & {
    contract_id: string | null;
  })[];
  const NONE = "__none__";
  const gruppiPagamenti = Array.from(
    pays.reduce((map, p) => {
      const k = p.contract_id ?? NONE;
      const arr = map.get(k) ?? [];
      arr.push({
        numero_rata: p.numero_rata,
        importo: p.importo,
        scadenza: p.scadenza,
        stato: p.stato,
      });
      map.set(k, arr);
      return map;
    }, new Map<string, RataRow[]>()),
  ).map(([k, rate]) => {
    const contract = k === NONE ? null : contratti.find((c) => c.id === k) ?? null;
    const label = contract
      ? contract.signed_at
        ? `Contratto · firmato il ${dataIt(contract.signed_at)}`
        : "Contratto"
      : "Piano";
    return { key: k, label, rate };
  });

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/vendite/clienti"
        className="text-[13px] font-semibold text-text-2 hover:text-text"
      >
        ← Clienti
      </Link>

      <header className="mt-3 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
            {c.ragione_sociale}
          </h1>
          {c.referente && (
            <p className="mt-0.5 text-sm text-text-2">{c.referente}</p>
          )}
        </div>
        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* Colonna sinistra: anagrafica + pagamenti + contratti */}
        <div className="flex flex-col gap-5 lg:col-span-1">
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
                  const servizi = scadenzeServizi(
                    ct.quote?.ordine ?? null,
                    ct.signed_at,
                  );
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
                            <ActionLink
                              href={ct.signed_pdf_url}
                              label="PDF firmato"
                              icon="pdf"
                            />
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
                              <span className="min-w-0 truncate text-text-2">
                                {s.label}
                              </span>
                              <span className="flex-none text-text-3">
                                {labelScadenza(s)}
                              </span>
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

        {/* Colonna destra: nuovo preventivo (ampio) + preventivi inviati */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Nuovo preventivo</CardTitle>
            </CardHeader>
            <CreateQuoteForm clientId={c.id} prezziBase={prezziBase} />
          </Card>

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
        </div>
      </div>
    </div>
  );
}
