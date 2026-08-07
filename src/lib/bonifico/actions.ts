"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emailBrand } from "@/lib/email/templates";
import { generaRate } from "@/lib/preventivi/genera-rate";
import { conIva, euro } from "@/lib/format";

const ADMIN = "marco@convivostudio.it";
const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

export type BonificoResult = { ok: true } | { ok: false; error: string };

/**
 * Registra la scelta "pago con bonifico" (solo una tantum) dal flusso /paga:
 * crea la rata unica MANUALE (programmata), imposta payment_setup bonifico/manuale
 * e avvisa lo staff. NON attiva il cliente: l'attivazione avviene quando Marco
 * segna la rata pagata (a riscontro della contabile). Contesto anon → admin client.
 */
export async function registraBonifico(token: string): Promise<BonificoResult> {
  const db = createAdminClient();

  const { data: quote } = await db
    .from("quotes")
    .select(
      "id, numero, tipo, importo_totale, client:clients!quotes_client_id_fkey(id, ragione_sociale, email)",
    )
    .eq("public_token", token)
    .maybeSingle();
  if (!quote || !quote.client)
    return { ok: false, error: "Preventivo non trovato." };
  if (quote.tipo !== "una_tantum")
    return {
      ok: false,
      error: "Il bonifico è disponibile solo per i pagamenti in un'unica soluzione.",
    };
  const client = quote.client as unknown as {
    id: string;
    ragione_sociale: string;
    email: string | null;
  };

  const { data: contract } = await db
    .from("contracts")
    .select("id")
    .eq("quote_id", quote.id)
    .maybeSingle();
  const contractId = contract?.id ?? null;

  // Idempotenza: se il piano per questo contratto esiste già, stop.
  let payQ = db
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id);
  payQ = contractId
    ? payQ.eq("contract_id", contractId)
    : payQ.is("contract_id", null);
  const { count: rateEsistenti } = await payQ;
  if ((rateEsistenti ?? 0) > 0)
    return { ok: false, error: "Pagamento già impostato per questo preventivo." };

  // Rata unica "programmata" (generatore condiviso: una tantum → 1 rata).
  const rows = generaRate({
    tipo: "una_tantum",
    importoTotale: quote.importo_totale,
    rataMensile: null,
    rateNum: null,
  }).map((r) => ({
    client_id: client.id,
    contract_id: contractId,
    numero_rata: r.numero_rata,
    importo: r.importo,
    scadenza: r.scadenza,
    stato: "scheduled" as const,
  }));
  const { error: insErr } = await db.from("payments").insert(rows);
  if (insErr) return { ok: false, error: insErr.message };

  // payment_setup bonifico/manuale (upsert per cliente+contratto).
  const psSel = db.from("payment_setups").select("id").eq("client_id", client.id);
  const { data: psExist } = await (contractId
    ? psSel.eq("contract_id", contractId)
    : psSel.is("contract_id", null)
  ).maybeSingle();
  if (psExist?.id) {
    await db
      .from("payment_setups")
      .update({ metodo: "bonifico", stato: "manuale", stripe_subscription_id: null })
      .eq("id", psExist.id);
  } else {
    await db.from("payment_setups").insert({
      client_id: client.id,
      contract_id: contractId,
      metodo: "bonifico",
      stato: "manuale",
    });
  }

  // Metodo scelto → pagamento_setup (NON attiva: attende la contabile).
  await db
    .from("clients")
    .update({ stato: "pagamento_setup" })
    .eq("id", client.id)
    .in("stato", [
      "preventivo_accettato",
      "contratto_inviato",
      "contratto_firmato",
    ]);

  await inviaAvvisoBonifico({
    clientId: client.id,
    ragioneSociale: client.ragione_sociale,
    numero: quote.numero,
    importoNetto: Number(quote.importo_totale ?? 0),
  });

  return { ok: true };
}

async function inviaAvvisoBonifico(opts: {
  clientId: string;
  ragioneSociale: string;
  numero: string | null;
  importoNetto: number;
}): Promise<void> {
  try {
    const db = createAdminClient();
    const dest = new Set<string>([ADMIN]);
    const { data: cli } = await db
      .from("clients")
      .select("owner_id")
      .eq("id", opts.clientId)
      .maybeSingle();
    const ownerId = (cli as { owner_id: string | null } | null)?.owner_id;
    if (ownerId) {
      const { data: owner } = await db
        .from("profiles")
        .select("email")
        .eq("id", ownerId)
        .maybeSingle();
      const oe = (owner as { email: string | null } | null)?.email;
      if (oe) dest.add(oe);
    }

    const html = emailBrand({
      heading: "Pagamento con bonifico in attesa di contabile",
      paragraphs: [
        `<b>${opts.ragioneSociale}</b> ha scelto di pagare in un'unica soluzione con bonifico.`,
        `Importo: <b>${euro(opts.importoNetto)}</b> netti (${euro(conIva(opts.importoNetto))} IVA inclusa).<br>Causale attesa: <b>${opts.numero ?? "—"}</b>.`,
        `Quando arriva la contabile su ${BONIFICO_EMAIL}, segna la rata come pagata: il cliente verrà attivato e riceverà l'accesso al portale.`,
      ],
      cta: { label: "Apri il cliente", url: `${SITE}/vendite/clienti/${opts.clientId}` },
    });
    await sendEmail({
      to: [...dest],
      subject: `Bonifico da incassare — ${opts.ragioneSociale}`,
      html,
    });
  } catch {
    // best-effort
  }
}

const BONIFICO_EMAIL = "info@digital-discovery.it";
