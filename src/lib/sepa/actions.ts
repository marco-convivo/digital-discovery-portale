"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emailBrand } from "@/lib/email/templates";
import { inviaAccessoPortale } from "@/lib/portale/welcome";
import { euro } from "@/lib/format";
import { SEPA_CREDITORE, isValidIban, normalizeIban } from "@/lib/sepa/config";

const ADMIN = "marco@convivostudio.it";
const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

export type MandatoResult = { ok: true } | { ok: false; error: string };

export interface MandatoInput {
  intestatario: string;
  iban: string;
  bic?: string | null;
  indirizzo?: string | null;
  email?: string | null;
  consenso: boolean;
}

function scadenzaMese(mesiAvanti: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + mesiAvanti);
  return d.toISOString().slice(0, 10);
}

/**
 * Registra un mandato SEPA (SDD B2B) dal flusso /paga: salva il mandato, crea il
 * piano rate MANUALE (nessuno Stripe — gli addebiti li invia Marco su Banca
 * Sella), attiva il cliente e avvisa staff + cliente. Contesto anon → admin
 * client filtrato per public_token.
 */
export async function registraMandatoSepa(
  token: string,
  input: MandatoInput,
): Promise<MandatoResult> {
  const intestatario = input.intestatario.trim();
  const iban = normalizeIban(input.iban ?? "");
  if (!input.consenso)
    return { ok: false, error: "Devi accettare il mandato per procedere." };
  if (!intestatario)
    return { ok: false, error: "Indica l'intestatario del conto." };
  if (!isValidIban(iban))
    return { ok: false, error: "IBAN non valido: controlla e riprova." };

  const db = createAdminClient();

  const { data: quote } = await db
    .from("quotes")
    .select(
      "id, tipo, importo_totale, rata_mensile, rate_num, client:clients!quotes_client_id_fkey(id, ragione_sociale, email)",
    )
    .eq("public_token", token)
    .maybeSingle();
  if (!quote || !quote.client)
    return { ok: false, error: "Preventivo non trovato." };
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

  // Evita doppioni: se esiste già un mandato per questo preventivo, stop.
  const { count: giaEsiste } = await db
    .from("sepa_mandates")
    .select("id", { count: "exact", head: true })
    .eq("quote_id", quote.id);
  if ((giaEsiste ?? 0) > 0)
    return { ok: false, error: "Mandato già registrato per questo preventivo." };

  const riferimento = `MND-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const { error: insErr } = await db.from("sepa_mandates").insert({
    client_id: client.id,
    contract_id: contractId,
    quote_id: quote.id,
    riferimento,
    intestatario,
    iban,
    bic: input.bic?.trim() || null,
    indirizzo: input.indirizzo?.trim() || null,
    email: input.email?.trim() || null,
    creditor_id: SEPA_CREDITORE.creditorId,
  });
  if (insErr) return { ok: false, error: insErr.message };

  // Piano rate MANUALE (nessuna subscription Stripe).
  const ricorrente = quote.tipo === "ricorrente";
  const rateNum = ricorrente ? (quote.rate_num ?? 12) : 1;
  const rataImporto = ricorrente
    ? Number(quote.rata_mensile ?? 0)
    : Number(quote.importo_totale ?? 0);
  const rows = Array.from({ length: rateNum }, (_, i) => ({
    client_id: client.id,
    contract_id: contractId,
    numero_rata: i + 1,
    importo: rataImporto,
    scadenza: scadenzaMese(i),
    stato: "scheduled" as const,
  }));
  await db.from("payments").insert(rows);

  // payment_setup manuale (upsert per cliente+contratto).
  const psSel = db
    .from("payment_setups")
    .select("id")
    .eq("client_id", client.id);
  const { data: psExist } = await (contractId
    ? psSel.eq("contract_id", contractId)
    : psSel.is("contract_id", null)
  ).maybeSingle();
  if (psExist?.id) {
    await db
      .from("payment_setups")
      .update({ metodo: "sdd", stato: "manuale", stripe_subscription_id: null })
      .eq("id", psExist.id);
  } else {
    await db.from("payment_setups").insert({
      client_id: client.id,
      contract_id: contractId,
      metodo: "sdd",
      stato: "manuale",
    });
  }

  // Cliente attivo (transizione atomica).
  await db
    .from("clients")
    .update({ stato: "cliente_attivo" })
    .eq("id", client.id)
    .not("stato", "in", "(cliente_attivo,cessato)");

  // Avvisi: staff (con dati mandato per Sella) + accesso portale al cliente.
  await inviaAvvisoMandato({
    clientId: client.id,
    ragioneSociale: client.ragione_sociale,
    intestatario,
    iban,
    riferimento,
    rataImporto,
    rateNum,
    ricorrente,
  });
  await inviaAccessoPortale(client.email);

  return { ok: true };
}

async function inviaAvvisoMandato(opts: {
  clientId: string;
  ragioneSociale: string;
  intestatario: string;
  iban: string;
  riferimento: string;
  rataImporto: number;
  rateNum: number;
  ricorrente: boolean;
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

    const piano = opts.ricorrente
      ? `${euro(opts.rataImporto)}/mese × ${opts.rateNum} rate`
      : `${euro(opts.rataImporto)} in un'unica soluzione`;

    const html = emailBrand({
      heading: "Nuovo mandato SEPA da attivare su Banca Sella",
      paragraphs: [
        `<b>${opts.ragioneSociale}</b> ha compilato e accettato il mandato SDD.`,
        `Intestatario: <b>${opts.intestatario}</b><br>IBAN: <b>${opts.iban}</b><br>Riferimento mandato: <b>${opts.riferimento}</b>`,
        `Piano: ${piano}. Attiva l'addebito su Sella SBS; le rate le segni pagate a riscontro.`,
      ],
      cta: { label: "Apri il cliente", url: `${SITE}/vendite/clienti/${opts.clientId}` },
    });
    await sendEmail({
      to: [...dest],
      subject: `Mandato SEPA da attivare — ${opts.ragioneSociale}`,
      html,
    });
  } catch {
    // best-effort
  }
}
