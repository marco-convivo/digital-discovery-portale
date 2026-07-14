"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emailBrand } from "@/lib/email/templates";

const ADMIN = "marco@convivostudio.it";

export type ActionResult = { ok: true } | { ok: false; error: string };

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Il cliente invia una richiesta di assistenza → email a referente (owner) + admin. */
export async function inviaRichiestaAssistenza(input: {
  oggetto: string;
  messaggio: string;
}): Promise<ActionResult> {
  const oggetto = input.oggetto.trim();
  const messaggio = input.messaggio.trim();
  if (!oggetto) return { ok: false, error: "Indica un oggetto." };
  if (messaggio.length < 5)
    return { ok: false, error: "Scrivi un messaggio un po' più dettagliato." };

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Sessione scaduta." };

  const { data: client } = await sb
    .from("clients")
    .select("ragione_sociale, email, referente, owner_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const c = client as {
    ragione_sociale: string;
    email: string | null;
    referente: string | null;
    owner_id: string | null;
  } | null;
  if (!c) return { ok: false, error: "Cliente non trovato." };

  const dest = new Set<string>([ADMIN]);
  if (c.owner_id) {
    const db = createAdminClient();
    const { data: owner } = await db
      .from("profiles")
      .select("email")
      .eq("id", c.owner_id)
      .maybeSingle();
    const oe = (owner as { email: string | null } | null)?.email;
    if (oe) dest.add(oe);
  }

  const html = emailBrand({
    heading: "Richiesta di assistenza",
    paragraphs: [
      `<b>${esc(c.ragione_sociale)}</b>${c.referente ? ` — ${esc(c.referente)}` : ""}${c.email ? ` · ${esc(c.email)}` : ""}`,
      `<b>Oggetto:</b> ${esc(oggetto)}`,
      esc(messaggio).replace(/\n/g, "<br>"),
    ],
    footerNote: c.email ? `Rispondi direttamente a ${esc(c.email)}.` : undefined,
  });

  const sent = await sendEmail({
    to: [...dest],
    subject: `Assistenza: ${c.ragione_sociale} — ${oggetto}`,
    html,
    replyTo: c.email ?? undefined,
  });
  if (!sent)
    return {
      ok: false,
      error:
        "Invio non riuscito. Riprova tra poco o scrivici a info@digital-discovery.it.",
    };
  return { ok: true };
}
