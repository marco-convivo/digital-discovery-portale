"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { creaLinkRecupero } from "@/lib/stripe/recupero";
import { getStripe } from "@/lib/stripe/server";
import { sendEmail } from "@/lib/email/send";
import { emailBrand } from "@/lib/email/templates";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function assertStaff(): Promise<string | null> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return "Sessione scaduta.";
  const { data } = await sb
    .from("profiles")
    .select("active")
    .eq("id", user.id)
    .maybeSingle();
  if (!data || !(data as { active: boolean }).active)
    return "Accesso non abilitato.";
  return null;
}

/** Genera (o rigenera) il link di recupero carta e lo ritorna. */
export async function azioneGeneraLink(
  paymentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  const res = await creaLinkRecupero(paymentId);
  if (res.ok) revalidatePath("/vendite/insoluti");
  return res;
}

/** Genera il link e lo invia via email al cliente con testo pronto. */
export async function azioneInviaLinkEmail(
  paymentId: string,
): Promise<ActionResult> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };

  const link = await creaLinkRecupero(paymentId);
  if (!link.ok) return link;

  const sb = await createClient();
  const { data } = await sb
    .from("payments")
    .select(
      "numero_rata, client:clients!payments_client_id_fkey(ragione_sociale, email)",
    )
    .eq("id", paymentId)
    .maybeSingle();
  const row = data as unknown as {
    numero_rata: number | null;
    client: { ragione_sociale: string; email: string | null } | null;
  } | null;
  const email = row?.client?.email;
  if (!email)
    return {
      ok: false,
      error: "Il cliente non ha un'email: copia il link e invialo manualmente.",
    };

  const html = emailBrand({
    heading: "Salda la rata in sospeso",
    paragraphs: [
      `Gentile <b>${row?.client?.ragione_sociale ?? "Cliente"}</b>, l'addebito della rata ${row?.numero_rata ?? ""} non è andato a buon fine.`,
      "Puoi saldare in tutta sicurezza con carta dal pulsante qui sotto. Bastano pochi istanti.",
    ],
    cta: { label: "Salda ora", url: link.url },
    fallbackUrl: link.url,
  });

  const sent = await sendEmail({
    to: email,
    subject: "Salda la rata in sospeso — Digital Discovery",
    html,
  });
  if (!sent)
    return {
      ok: false,
      error: "Email non inviata (config Resend mancante): copia il link e invialo tu.",
    };
  revalidatePath("/vendite/insoluti");
  return { ok: true };
}

/** Segna la rata pagata manualmente (es. bonifico ricevuto). */
export async function azioneSegnaPagato(
  paymentId: string,
): Promise<ActionResult> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  const sb = await createClient();
  const { error } = await sb
    .from("payments")
    .update({
      stato: "paid",
      paid_at: new Date().toISOString(),
      recovery_stato: "recuperato",
    })
    .eq("id", paymentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/insoluti");
  return { ok: true };
}

/**
 * Invia al cliente il link per rifare il mandato SEPA (nuovo IBAN), utile per
 * insoluti ripetuti. Ritorna anche il link, per invio manuale se serve.
 */
export async function azioneNuovoMandato(
  paymentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  const sb = await createClient();

  const { data: p } = await sb
    .from("payments")
    .select(
      "contract_id, client:clients!payments_client_id_fkey(ragione_sociale, email)",
    )
    .eq("id", paymentId)
    .maybeSingle();
  const row = p as unknown as {
    contract_id: string | null;
    client: { ragione_sociale: string; email: string | null } | null;
  } | null;
  if (!row?.contract_id)
    return { ok: false, error: "Contratto non collegato alla rata." };

  const { data: contract } = await sb
    .from("contracts")
    .select("quote_id")
    .eq("id", row.contract_id)
    .maybeSingle();
  const quoteId = (contract as { quote_id: string | null } | null)?.quote_id;
  if (!quoteId) return { ok: false, error: "Preventivo non trovato." };

  const { data: quote } = await sb
    .from("quotes")
    .select("public_token")
    .eq("id", quoteId)
    .maybeSingle();
  const token = (quote as { public_token: string } | null)?.public_token;
  if (!token) return { ok: false, error: "Token pagamento non trovato." };

  const url = `${SITE}/paga/${token}`;

  await sb
    .from("payments")
    .update({ recovery_stato: "nuovo_mandato" })
    .eq("id", paymentId);

  const email = row.client?.email;
  if (email) {
    await sendEmail({
      to: email,
      subject: "Aggiorna il metodo di pagamento — Digital Discovery",
      html: emailBrand({
        heading: "Aggiorna il metodo di pagamento",
        paragraphs: [
          `Gentile <b>${row.client?.ragione_sociale ?? "Cliente"}</b>, per riprendere gli addebiti ti chiediamo di aggiornare il metodo di pagamento (nuovo mandato SEPA o carta).`,
          "Bastano pochi istanti dal pulsante qui sotto.",
        ],
        cta: { label: "Aggiorna il pagamento", url },
        fallbackUrl: url,
      }),
    });
  }

  revalidatePath("/vendite/insoluti");
  return { ok: true, url };
}

/** Ritenta l'addebito SEPA sull'invoice fallito (stesso mandato). */
export async function azioneRitentaSepa(
  paymentId: string,
): Promise<ActionResult> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  const sb = await createClient();
  const { data: p } = await sb
    .from("payments")
    .select("stripe_invoice_id")
    .eq("id", paymentId)
    .maybeSingle();
  const invoiceId = (p as { stripe_invoice_id: string | null } | null)
    ?.stripe_invoice_id;
  if (!invoiceId)
    return {
      ok: false,
      error: "Nessun addebito SEPA da ritentare per questa rata.",
    };
  try {
    await getStripe().invoices.pay(invoiceId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore nel ritentare l'addebito.";
    return { ok: false, error: msg };
  }
  revalidatePath("/vendite/insoluti");
  return { ok: true };
}

/** Chiude l'insoluto senza incasso (rinuncia). */
export async function azioneAnnulla(paymentId: string): Promise<ActionResult> {
  const err = await assertStaff();
  if (err) return { ok: false, error: err };
  const sb = await createClient();
  const { error } = await sb
    .from("payments")
    .update({ recovery_stato: "annullato" })
    .eq("id", paymentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/insoluti");
  return { ok: true };
}
