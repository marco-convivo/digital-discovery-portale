"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { creaLinkRecupero } from "@/lib/stripe/recupero";
import { sendEmail } from "@/lib/email/send";
import { emailBrand } from "@/lib/email/templates";

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
