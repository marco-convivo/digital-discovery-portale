import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { CreateQuoteForm } from "@/components/internal/create-quote-form";
import { PianoPagamenti, type RataRow } from "@/components/internal/piano-pagamenti";
import { STATO_META } from "@/lib/stati";
import { euro, dataIt } from "@/lib/format";
import type { Client, ClientStato } from "@/lib/types";

const QUOTE_TONE: Record<string, Tone> = {
  bozza: "draft",
  inviato: "info",
  visto: "wait",
  accettato: "paid",
  rifiutato: "fail",
  scaduto: "fail",
};

const CONTRACT_TONE: Record<string, Tone> = {
  inviato: "info",
  firmato: "paid",
  annullato: "fail",
};

interface QuoteRow {
  id: string;
  numero: string | null;
  tipo: string;
  stato: string;
  importo_totale: number | null;
  public_token: string;
  created_at: string;
}

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

  const { data: quotesData } = await supabase
    .from("quotes")
    .select("id, numero, tipo, stato, importo_totale, public_token, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });
  const quotes = (quotesData ?? []) as unknown as QuoteRow[];

  const { data: payData } = await supabase
    .from("payments")
    .select("numero_rata, importo, scadenza, stato")
    .eq("client_id", id)
    .order("numero_rata", { ascending: true });
  const rate = (payData ?? []) as unknown as RataRow[];

  const { data: contrData } = await supabase
    .from("contracts")
    .select("id, stato, signed_at, signed_pdf_url, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });
  const contratti = (contrData ?? []) as unknown as ContractRow[];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/vendite"
        className="text-[13px] font-semibold text-text-2 hover:text-text"
      >
        ← Pipeline
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

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Anagrafica</CardTitle>
          </CardHeader>
          <dl className="flex flex-col gap-2.5 text-sm">
            <Row label="Email" value={c.email} />
            <Row label="Telefono" value={c.telefono} />
            <Row label="P. IVA" value={c.p_iva} />
            <Row label="Cod. fiscale" value={c.codice_fiscale} />
            <Row label="SDI / PEC" value={c.codice_sdi ?? c.pec} />
            <Row label="Indirizzo" value={c.indirizzo} />
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nuovo preventivo</CardTitle>
          </CardHeader>
          <CreateQuoteForm clientId={c.id} />
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Preventivi</CardTitle>
        </CardHeader>
        {quotes.length === 0 ? (
          <p className="text-sm text-text-3">Nessun preventivo ancora.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {quotes.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <div className="font-semibold text-text">
                    {q.numero ?? "—"}
                  </div>
                  <div className="text-[12.5px] text-text-3">
                    {dataIt(q.created_at)} · {euro(q.importo_totale)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill tone={QUOTE_TONE[q.stato] ?? "draft"}>
                    {q.stato}
                  </StatusPill>
                  <Link
                    href={`/preventivo/${q.public_token}`}
                    target="_blank"
                    className="text-[13px] font-semibold text-violet hover:underline"
                  >
                    Apri link
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Piano pagamenti</CardTitle>
        </CardHeader>
        <PianoPagamenti rate={rate} />
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Contratti</CardTitle>
        </CardHeader>
        {contratti.length === 0 ? (
          <p className="text-sm text-text-3">Nessun contratto ancora.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {contratti.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <div className="font-semibold text-text">
                    Contratto {c.signed_at ? `· firmato il ${dataIt(c.signed_at)}` : ""}
                  </div>
                  <div className="text-[12.5px] text-text-3">
                    Creato {dataIt(c.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill tone={CONTRACT_TONE[c.stato] ?? "draft"}>
                    {c.stato}
                  </StatusPill>
                  {c.signed_pdf_url && (
                    <a
                      href={c.signed_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-semibold text-violet hover:underline"
                    >
                      PDF firmato
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-3">{label}</dt>
      <dd className="text-right font-medium text-text">{value ?? "—"}</dd>
    </div>
  );
}
