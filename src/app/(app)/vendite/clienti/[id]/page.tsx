import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { AnagraficaEditor } from "@/components/internal/anagrafica-editor";
import { CreateQuoteForm } from "@/components/internal/create-quote-form";
import { PreventiviList, type PreventivoItem } from "@/components/internal/preventivi-list";
import { PianoPagamenti, type RataRow } from "@/components/internal/piano-pagamenti";
import { STATO_META } from "@/lib/stati";
import { dataIt } from "@/lib/format";
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

  const [{ data: quotesData }, { data: payData }, { data: contrData }] =
    await Promise.all([
      supabase
        .from("quotes")
        .select("id, numero, stato, importo_totale, public_token, created_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("numero_rata, importo, scadenza, stato")
        .eq("client_id", id)
        .order("numero_rata", { ascending: true }),
      supabase
        .from("contracts")
        .select("id, stato, signed_at, signed_pdf_url, created_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const quotes = (quotesData ?? []) as unknown as PreventivoItem[];
  const rate = (payData ?? []) as unknown as RataRow[];
  const contratti = (contrData ?? []) as unknown as ContractRow[];

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
            </CardHeader>
            <PianoPagamenti rate={rate} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contratti</CardTitle>
            </CardHeader>
            {contratti.length === 0 ? (
              <p className="text-sm text-text-3">Nessun contratto ancora.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {contratti.map((ct) => (
                  <li key={ct.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <div className="text-[13px] font-semibold text-text">
                        {ct.signed_at
                          ? `Firmato il ${dataIt(ct.signed_at)}`
                          : `Creato ${dataIt(ct.created_at)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill tone={CONTRACT_TONE[ct.stato] ?? "draft"}>
                        {ct.stato}
                      </StatusPill>
                      {ct.signed_pdf_url && (
                        <a
                          href={ct.signed_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] font-semibold text-violet hover:underline"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Colonna destra: nuovo preventivo (ampio) + preventivi inviati */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Nuovo preventivo</CardTitle>
            </CardHeader>
            <CreateQuoteForm clientId={c.id} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preventivi inviati</CardTitle>
            </CardHeader>
            <PreventiviList quotes={quotes} />
          </Card>
        </div>
      </div>
    </div>
  );
}
