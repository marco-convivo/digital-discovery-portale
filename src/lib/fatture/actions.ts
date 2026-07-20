"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviaAvvisoFattura } from "@/lib/fatture/email";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function currentStaffId(): Promise<string | null> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("profiles")
    .select("id, active")
    .eq("id", user.id)
    .maybeSingle();
  if (!data || !(data as { active: boolean }).active) return null;
  return user.id;
}

/**
 * Carica una fattura per un cliente: PDF nel bucket `fatture`, riga in `invoices`,
 * avviso email al cliente (best-effort). Solo staff.
 */
export async function caricaFattura(form: FormData): Promise<ActionResult> {
  const staff = await currentStaffId();
  if (!staff) return { ok: false, error: "Accesso non abilitato." };

  const clientId = String(form.get("clientId") ?? "").trim();
  const numero = String(form.get("numero") ?? "").trim();
  const data = String(form.get("data") ?? "").trim(); // YYYY-MM-DD
  const importo = Number(form.get("importo"));
  const file = form.get("file");

  if (!clientId) return { ok: false, error: "Cliente mancante." };
  if (!numero) return { ok: false, error: "Indica il numero della fattura." };
  if (!data) return { ok: false, error: "Indica la data della fattura." };
  if (!(importo > 0)) return { ok: false, error: "Importo non valido." };
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Allega il PDF della fattura." };
  if (file.type !== "application/pdf")
    return { ok: false, error: "Il file deve essere un PDF." };
  if (file.size > 15 * 1024 * 1024)
    return { ok: false, error: "PDF troppo grande (max 15MB)." };

  const db = createAdminClient();

  const path = `${clientId}/${crypto.randomUUID()}.pdf`;
  const { error: upErr } = await db.storage
    .from("fatture")
    .upload(path, file, { contentType: "application/pdf", upsert: true });
  if (upErr) return { ok: false, error: upErr.message };
  const { data: pub } = db.storage.from("fatture").getPublicUrl(path);

  const { error: insErr } = await db.from("invoices").insert({
    client_id: clientId,
    numero,
    data,
    importo,
    pdf_url: pub.publicUrl,
    stato: "emessa",
  });
  if (insErr) {
    // rollback del file per non lasciare orfani
    await db.storage.from("fatture").remove([path]);
    return { ok: false, error: insErr.message };
  }

  const { data: cli } = await db
    .from("clients")
    .select("ragione_sociale, email")
    .eq("id", clientId)
    .maybeSingle();
  const c = cli as { ragione_sociale: string; email: string | null } | null;
  if (c) {
    await inviaAvvisoFattura({
      email: c.email,
      ragioneSociale: c.ragione_sociale,
      numero,
    });
  }

  revalidatePath(`/vendite/clienti/${clientId}`);
  return { ok: true };
}

/** Elimina una fattura (riga + file). Solo staff. */
export async function eliminaFattura(
  id: string,
  clientId: string,
): Promise<ActionResult> {
  const staff = await currentStaffId();
  if (!staff) return { ok: false, error: "Accesso non abilitato." };

  const db = createAdminClient();
  const { data: row } = await db
    .from("invoices")
    .select("pdf_url")
    .eq("id", id)
    .maybeSingle();

  // Ricava il path dallo URL pubblico per rimuovere anche il file.
  const url = (row as { pdf_url: string | null } | null)?.pdf_url ?? null;
  const marker = "/fatture/";
  if (url && url.includes(marker)) {
    const path = url.slice(url.indexOf(marker) + marker.length);
    await db.storage.from("fatture").remove([decodeURIComponent(path)]);
  }

  const { error } = await db.from("invoices").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/vendite/clienti/${clientId}`);
  return { ok: true };
}
