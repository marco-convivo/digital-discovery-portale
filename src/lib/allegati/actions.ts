"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

const BUCKET = "allegati";

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
 * Carica un allegato PDF per un cliente nel bucket privato `allegati` e crea la
 * riga in `client_attachments`. `tipo` = "visura" (unico) o "libero". Solo staff.
 */
export async function caricaAllegato(form: FormData): Promise<ActionResult> {
  const staff = await currentStaffId();
  if (!staff) return { ok: false, error: "Accesso non abilitato." };

  const clientId = String(form.get("clientId") ?? "").trim();
  const tipo = String(form.get("tipo") ?? "libero").trim() === "visura" ? "visura" : "libero";
  const nome =
    tipo === "visura"
      ? "Visura"
      : String(form.get("nome") ?? "").trim();
  const file = form.get("file");

  if (!clientId) return { ok: false, error: "Cliente mancante." };
  if (!nome) return { ok: false, error: "Dai un nome all'allegato." };
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Allega un file PDF." };
  if (file.type !== "application/pdf")
    return { ok: false, error: "Il file deve essere un PDF." };
  if (file.size > 15 * 1024 * 1024)
    return { ok: false, error: "PDF troppo grande (max 15MB)." };

  const db = createAdminClient();

  // La Visura è unica per cliente: se esiste già, sostituiscila (elimina la vecchia).
  if (tipo === "visura") {
    const { data: old } = await db
      .from("client_attachments")
      .select("id, storage_path")
      .eq("client_id", clientId)
      .eq("tipo", "visura");
    for (const o of (old ?? []) as { id: string; storage_path: string }[]) {
      await db.storage.from(BUCKET).remove([o.storage_path]);
      await db.from("client_attachments").delete().eq("id", o.id);
    }
  }

  const path = `${clientId}/${crypto.randomUUID()}.pdf`;
  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(path, file, { contentType: "application/pdf", upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  const { error: insErr } = await db.from("client_attachments").insert({
    client_id: clientId,
    nome,
    tipo,
    storage_path: path,
    uploaded_by: staff,
  });
  if (insErr) {
    await db.storage.from(BUCKET).remove([path]); // niente file orfani
    return { ok: false, error: insErr.message };
  }

  revalidatePath(`/vendite/clienti/${clientId}`);
  return { ok: true };
}

/** Elimina un allegato (riga + file). Solo staff. */
export async function eliminaAllegato(
  id: string,
  clientId: string,
): Promise<ActionResult> {
  const staff = await currentStaffId();
  if (!staff) return { ok: false, error: "Accesso non abilitato." };

  const db = createAdminClient();
  const { data: row } = await db
    .from("client_attachments")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  const path = (row as { storage_path: string } | null)?.storage_path;
  if (path) await db.storage.from(BUCKET).remove([path]);

  const { error } = await db.from("client_attachments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/vendite/clienti/${clientId}`);
  return { ok: true };
}

/** URL firmato a tempo per aprire un allegato del bucket privato. Solo staff. */
export async function getAllegatoUrl(
  id: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const staff = await currentStaffId();
  if (!staff) return { ok: false, error: "Accesso non abilitato." };

  const db = createAdminClient();
  const { data: row } = await db
    .from("client_attachments")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  const path = (row as { storage_path: string } | null)?.storage_path;
  if (!path) return { ok: false, error: "Allegato non trovato." };

  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(path, 120); // 2 minuti, sufficiente per aprirlo
  if (error || !data) return { ok: false, error: error?.message ?? "Errore." };
  return { ok: true, url: data.signedUrl };
}
