import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSubmission,
  getSubmission,
  getTemplateFields,
  completeSubmitter,
  type PrefillField,
} from "@/lib/docuseal/server";
import { CATALOG, serviziDaOrdine, type OrdineSelezione } from "@/lib/catalog";

export interface FirmaMeta {
  ip: string;
  userAgent: string;
  consensoAt: string;
  vessatorieAt: string; // approvazione specifica artt. 1341/1342 c.c.
}

export interface ContrattoHeader {
  numero: string | null;
  importo: number | null;
  rata: number | null;
  rateNum: number | null;
  servizi: string[]; // etichette leggibili
  serviceKeys: string[]; // chiavi catalogo (per Condizioni Particolari)
}

// Flusso firma pubblico (anon): admin client scoping sul token del preventivo.
// Il cliente compila i Dati del Cliente nel NOSTRO form; noi li passiamo a
// DocuSeal come prefill e al cliente resta solo la firma.

export interface DatiCliente {
  ragioneSociale: string;
  sdi: string;
  indirizzo: string;
  pivaCf: string;
  rappresentante: string;
  rappresentanteCf: string;
  rappresentanteIndirizzo: string;
  pec: string;
  email: string;
}

export type ContractView =
  | { status: "firmato" }
  | {
      status: "form";
      ragioneSociale: string;
      prefill: Partial<DatiCliente>;
      contratto: ContrattoHeader;
    }
  | null;

function num(n: number | null | undefined): string {
  return new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2 }).format(
    Number(n ?? 0),
  );
}
function oggiIt(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function oggiIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Da ordine (catalogo) → valori dei campi checkbox/testo servizi del contratto.
function serviceFields(ordine: OrdineSelezione | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!ordine) return out;
  for (const svc of CATALOG) {
    const sel = ordine[svc.key];
    if (!sel?.selected) continue;
    out[svc.docusealField] = "true";
    if (svc.option?.choices) {
      for (const c of svc.option.choices) {
        if (sel.channels?.includes(c.value) || sel.tipo === c.value) {
          out[c.docusealField] = "true";
        }
      }
    }
    if (sel.durata) out[`${svc.key}_durata`] = String(sel.durata);
    if (sel.quantita) out[`${svc.key}_qta`] = String(sel.quantita);
  }
  return out;
}

interface QuoteRow {
  id: string;
  numero: string | null;
  importo_totale: number | null;
  rate_num: number | null;
  rata_mensile: number | null;
  ordine: OrdineSelezione | null;
  client: {
    id: string;
    ragione_sociale: string;
    email: string | null;
    stato: string;
    codice_sdi: string | null;
    indirizzo: string | null;
    p_iva: string | null;
    pec: string | null;
    referente: string | null;
  } | null;
}

async function loadQuote(token: string): Promise<QuoteRow | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("quotes")
    .select(
      "id, numero, importo_totale, rate_num, rata_mensile, ordine, client:clients!quotes_client_id_fkey(id, ragione_sociale, email, stato, codice_sdi, indirizzo, p_iva, pec, referente)",
    )
    .eq("public_token", token)
    .maybeSingle();
  return data as unknown as QuoteRow | null;
}

/** Cosa mostrare su /firma: già firmato, oppure firma (submission pronta),
 *  oppure il form Dati Cliente (con prefill da ciò che sappiamo). */
export async function getContractView(token: string): Promise<ContractView> {
  const q = await loadQuote(token);
  if (!q || !q.client) return null;
  const db = createAdminClient();

  const { data: contract } = await db
    .from("contracts")
    .select("id, stato")
    .eq("quote_id", q.id)
    .maybeSingle();

  // Firma sincrona: un contratto esiste solo se già firmato.
  if (contract) return { status: "firmato" };

  const serviceKeys = CATALOG.filter((c) => q.ordine?.[c.key]?.selected).map(
    (c) => c.key,
  );

  return {
    status: "form",
    ragioneSociale: q.client.ragione_sociale,
    prefill: {
      ragioneSociale: q.client.ragione_sociale,
      sdi: q.client.codice_sdi ?? "",
      indirizzo: q.client.indirizzo ?? "",
      pivaCf: q.client.p_iva ?? "",
      rappresentante: q.client.referente ?? "",
      pec: q.client.pec ?? "",
      email: q.client.email ?? "",
    },
    contratto: {
      numero: q.numero,
      importo: q.importo_totale,
      rata: q.rata_mensile,
      rateNum: q.rate_num,
      servizi: serviziDaOrdine(q.ordine),
      serviceKeys,
    },
  };
}

export type SignResult = { ok: true } | { ok: false; error: string };

/**
 * Firma sincrona (ibrida): il cliente ha compilato i Dati e firmato nel nostro
 * canvas. Salva l'anagrafica, crea la submission DocuSeal con TUTTO prefillato,
 * la completa via API con l'immagine firma + metadata di audit, salva il PDF
 * firmato e porta la pratica a `pagamento_setup`. Idempotente.
 */
export async function signContract(
  token: string,
  dati: DatiCliente,
  signaturePng: string,
  meta: FirmaMeta,
): Promise<SignResult> {
  const q = await loadQuote(token);
  if (!q || !q.client) return { ok: false, error: "Preventivo non trovato." };
  if (!signaturePng) return { ok: false, error: "Firma mancante." };
  const db = createAdminClient();

  const { data: existing } = await db
    .from("contracts")
    .select("id")
    .eq("quote_id", q.id)
    .maybeSingle();
  if (existing) return { ok: false, error: "Contratto già firmato." };

  // anagrafica confermata dal cliente
  await db
    .from("clients")
    .update({
      ragione_sociale: dati.ragioneSociale || q.client.ragione_sociale,
      codice_sdi: dati.sdi || null,
      indirizzo: dati.indirizzo || null,
      p_iva: dati.pivaCf || null,
      pec: dati.pec || null,
      email: dati.email || null,
      referente: dati.rappresentante || null,
    })
    .eq("id", q.client.id);

  const candidates: Record<string, string> = {
    numero_ordine: q.numero ?? "",
    importo: num(q.importo_totale),
    importo_rata: num(q.rata_mensile),
    rate: String(q.rate_num ?? ""),
    scadenza_prima_rata: oggiIt(),
    luogo: "L'Aquila",
    data: oggiIso(),
    cliente_ragione_sociale: dati.ragioneSociale,
    cliente_sdi: dati.sdi,
    cliente_indirizzo: dati.indirizzo,
    cliente_piva_cf: dati.pivaCf,
    cliente_rappresentante: dati.rappresentante,
    cliente_rappresentante_cf: dati.rappresentanteCf,
    cliente_rappresentante_indirizzo: dati.rappresentanteIndirizzo,
    cliente_pec: dati.pec,
    cliente_email: dati.email,
    ...serviceFields(q.ordine),
  };

  const templateId = Number(process.env.DOCUSEAL_TEMPLATE_ID);
  const { allowed, signatureNames, role } = await getTemplateFields(templateId);
  const fields: PrefillField[] = Object.entries(candidates)
    .filter(([name, value]) => allowed.has(name) && value !== "")
    .map(([name, default_value]) => ({ name, default_value }));

  const submitter = await createSubmission({
    templateId,
    role,
    name: dati.ragioneSociale || q.client.ragione_sociale,
    email: dati.email || q.client.email || "cliente@example.com",
    fields,
  });

  // Applica la firma catturata a tutti i campi firma del template.
  const signValues: Record<string, string> = {};
  for (const name of signatureNames) signValues[name] = signaturePng;

  await completeSubmitter(submitter.id, signValues, {
    ip: meta.ip,
    user_agent: meta.userAgent,
    consenso_at: meta.consensoAt,
    approvazione_vessatorie_at: meta.vessatorieAt,
    email: dati.email,
  });

  // PDF firmato + audit trail
  const sub = await getSubmission(submitter.submission_id);
  const signedPdfUrl = sub.documents?.[0]?.url ?? null;

  await db.from("contracts").insert({
    quote_id: q.id,
    client_id: q.client.id,
    docuseal_submission_id: String(submitter.submission_id),
    stato: "firmato",
    signed_at: new Date().toISOString(),
    signed_pdf_url: signedPdfUrl,
  });

  await db
    .from("clients")
    .update({ stato: "pagamento_setup" })
    .eq("id", q.client.id)
    .in("stato", [
      "preventivo_inviato",
      "preventivo_visto",
      "preventivo_accettato",
      "contratto_inviato",
    ]);

  return { ok: true };
}

/** Webhook DocuSeal (form.completed): contratto firmato → salva PDF, avanza a
 *  pagamento_setup. Idempotente. */
export async function handleContractSigned(
  submissionId: string,
  signedPdfUrl: string | null,
): Promise<void> {
  if (!submissionId) return;
  const db = createAdminClient();
  const { data: contract } = await db
    .from("contracts")
    .select("id, client_id, stato")
    .eq("docuseal_submission_id", submissionId)
    .maybeSingle();
  if (!contract || contract.stato === "firmato") return;

  await db
    .from("contracts")
    .update({
      stato: "firmato",
      signed_at: new Date().toISOString(),
      signed_pdf_url: signedPdfUrl,
    })
    .eq("id", contract.id);

  await db
    .from("clients")
    .update({ stato: "pagamento_setup" })
    .eq("id", contract.client_id)
    .eq("stato", "contratto_inviato");
}
