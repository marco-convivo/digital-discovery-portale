import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSubmission, getSubmission } from "@/lib/docuseal/server";

// Contesto firma pubblico (anon): admin client scoping sul token del preventivo.

export type ContractContext =
  | { status: "firmato" }
  | { status: "da_firmare"; embedSrc: string; ragioneSociale: string };

function num(n: number | null | undefined): string {
  return new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2 }).format(
    Number(n ?? 0),
  );
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
      "id, client_id, importo_totale, rate_num, client:clients!quotes_client_id_fkey(id, ragione_sociale, email, stato)",
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

  // crea la submission DocuSeal (campi prefillati)
  const submitter = await createSubmission({
    templateId: Number(process.env.DOCUSEAL_TEMPLATE_ID),
    name: client.ragione_sociale,
    email: client.email ?? "cliente@example.com",
    fields: [
      { name: "ragione_sociale", default_value: client.ragione_sociale },
      { name: "importo", default_value: num(quote.importo_totale) },
      { name: "rate", default_value: String(quote.rate_num ?? "") },
    ],
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
