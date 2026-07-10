import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSubmission,
  getSubmission,
  getTemplateFieldNames,
  type PrefillField,
} from "@/lib/docuseal/server";
import { CATALOG, type OrdineSelezione } from "@/lib/catalog";

// Contesto firma pubblico (anon): admin client scoping sul token del preventivo.

export type ContractContext =
  | { status: "firmato" }
  | { status: "da_firmare"; embedSrc: string; ragioneSociale: string };

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

// Da ordine (catalogo) → valori dei campi checkbox/testo servizi nel contratto.
function serviceFields(ordine: OrdineSelezione | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!ordine) return out;
  for (const svc of CATALOG) {
    const sel = ordine[svc.key];
    if (!sel?.selected) continue;
    out[svc.docusealField] = "true"; // checkbox servizio
    if (svc.option?.choices) {
      for (const c of svc.option.choices) {
        const on =
          sel.channels?.includes(c.value) || sel.tipo === c.value;
        if (on) out[c.docusealField] = "true";
      }
    }
    if (sel.durata) out[`${svc.key}_durata`] = String(sel.durata);
    if (sel.quantita) out[`${svc.key}_qta`] = String(sel.quantita);
  }
  return out;
}

/**
 * Garantisce una submission DocuSeal per il preventivo (token) e restituisce
 * l'URL embedded per la firma. Alla prima apertura crea la submission, la riga
 * `contracts` e porta il cliente a `contratto_inviato`.
 */
export async function ensureContractForToken(
  token: string,
): Promise<ContractContext | null> {
  const db = createAdminClient();

  const { data: quote } = await db
    .from("quotes")
    .select(
      "id, client_id, numero, importo_totale, rate_num, rata_mensile, ordine, client:clients!quotes_client_id_fkey(id, ragione_sociale, email, stato)",
    )
    .eq("public_token", token)
    .maybeSingle();
  if (!quote || !quote.client) return null;
  const client = quote.client as unknown as {
    id: string;
    ragione_sociale: string;
    email: string | null;
    stato: string;
  };

  // contratto già esistente per questo preventivo?
  const { data: existing } = await db
    .from("contracts")
    .select("id, docuseal_submission_id, stato")
    .eq("quote_id", quote.id)
    .maybeSingle();

  if (existing) {
    if (existing.stato === "firmato") return { status: "firmato" };
    const sub = await getSubmission(Number(existing.docuseal_submission_id));
    const submitter = sub.submitters[0];
    if (submitter?.status === "completed") return { status: "firmato" };
    return {
      status: "da_firmare",
      embedSrc: submitter.embed_src,
      ragioneSociale: client.ragione_sociale,
    };
  }

  // Prefill: tutti i dati che conosciamo. Filtriamo sui campi realmente
  // presenti nel template (DocuSeal dà 422 sui campi sconosciuti), così lo
  // stesso codice regge sia il template di test sia quello reale.
  // Prefill lato NOSTRO (dal preventivo). I "Dati del Cliente" li compila il
  // cliente in fase di firma, quindi NON li prefilliamo.
  const templateId = Number(process.env.DOCUSEAL_TEMPLATE_ID);
  const candidates: Record<string, string> = {
    numero_ordine: quote.numero ?? "",
    importo: num(quote.importo_totale),
    importo_rata: num(quote.rata_mensile),
    rate: String(quote.rate_num ?? ""),
    scadenza_prima_rata: oggiIt(),
    luogo: "L'Aquila",
    data: oggiIso(),
    ...serviceFields(quote.ordine as OrdineSelezione | null),
  };
  const allowed = await getTemplateFieldNames(templateId);
  const fields: PrefillField[] = Object.entries(candidates)
    .filter(([name, value]) => allowed.has(name) && value !== "")
    .map(([name, default_value]) => ({ name, default_value }));

  const submitter = await createSubmission({
    templateId,
    name: client.ragione_sociale,
    email: client.email ?? "cliente@example.com",
    fields,
  });

  await db.from("contracts").insert({
    quote_id: quote.id,
    client_id: client.id,
    docuseal_submission_id: String(submitter.submission_id),
    stato: "inviato",
  });

  if (
    ["preventivo_accettato", "preventivo_visto", "preventivo_inviato"].includes(
      client.stato,
    )
  ) {
    await db
      .from("clients")
      .update({ stato: "contratto_inviato" })
      .eq("id", client.id);
  }

  return {
    status: "da_firmare",
    embedSrc: submitter.embed_src,
    ragioneSociale: client.ragione_sociale,
  };
}

/**
 * Webhook DocuSeal (form.completed): contratto firmato → salva PDF, avanza la
 * pratica a `pagamento_setup`. Idempotente.
 */
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
