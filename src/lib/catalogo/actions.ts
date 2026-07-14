"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Il catalogo è interamente riservato all'admin (scrittura). Ritorna un
// messaggio d'errore se l'utente non è admin attivo, altrimenti null.
async function assertAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Sessione scaduta.";
  const { data } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();
  const p = data as { role: string; active: boolean } | null;
  if (!p || !p.active) return "Accesso non abilitato.";
  if (p.role !== "admin")
    return "Solo un amministratore può gestire il catalogo.";
  return null;
}

const toList = (s: string) =>
  s
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);

export interface ServizioContenuto {
  titolo: string;
  sottotitolo: string;
  descrizione: string;
  attivita_incluse: string; // multilinea → text[]
  condizioni: string;
  attivita_escluse: string;
  prezzo_base: number | null;
  ordine: number;
  attivo: boolean;
}

/** Aggiorna i contenuti di un servizio (per chiave). */
export async function updateServizio(
  chiave: string,
  input: ServizioContenuto,
): Promise<ActionResult> {
  const err = await assertAdmin();
  if (err) return { ok: false, error: err };
  if (!input.titolo.trim()) return { ok: false, error: "Il titolo è obbligatorio." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_catalog")
    .update({
      titolo: input.titolo.trim(),
      sottotitolo: input.sottotitolo.trim() || null,
      descrizione: input.descrizione.trim() || null,
      attivita_incluse: toList(input.attivita_incluse),
      condizioni: toList(input.condizioni),
      attivita_escluse: toList(input.attivita_escluse),
      prezzo_base: input.prezzo_base,
      ordine: input.ordine,
      attivo: input.attivo,
      updated_at: new Date().toISOString(),
    })
    .eq("chiave", chiave);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/vendite/catalogo/${chiave}`);
  revalidatePath("/vendite/catalogo");
  revalidatePath("/catalogo");
  revalidatePath(`/catalogo/${chiave}`);
  return { ok: true };
}

export interface PortfolioInput {
  id?: string;
  service_id: string;
  titolo: string;
  cliente: string;
  settore: string;
  descrizione: string;
  risultato: string;
  link_url: string;
  immagine_url: string | null;
  ordine: number;
}

/** Crea o aggiorna un lavoro di portfolio. */
export async function savePortfolioItem(
  input: PortfolioInput,
): Promise<ActionResult> {
  const err = await assertAdmin();
  if (err) return { ok: false, error: err };
  if (!input.titolo.trim()) return { ok: false, error: "Il titolo è obbligatorio." };
  const supabase = await createClient();
  const payload = {
    service_id: input.service_id,
    titolo: input.titolo.trim(),
    cliente: input.cliente.trim() || null,
    settore: input.settore.trim() || null,
    descrizione: input.descrizione.trim() || null,
    risultato: input.risultato.trim() || null,
    link_url: input.link_url.trim() || null,
    immagine_url: input.immagine_url,
    ordine: input.ordine,
  };
  const { error } = input.id
    ? await supabase.from("portfolio_items").update(payload).eq("id", input.id)
    : await supabase.from("portfolio_items").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/catalogo");
  return { ok: true };
}

export async function deletePortfolioItem(id: string): Promise<ActionResult> {
  const err = await assertAdmin();
  if (err) return { ok: false, error: err };
  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/catalogo");
  return { ok: true };
}

/** Upload immagine sul bucket pubblico `catalogo`; ritorna l'URL pubblico. */
export async function uploadImmagine(
  form: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const err = await assertAdmin();
  if (err) return { ok: false, error: err };
  const file = form.get("file");
  const prefix = String(form.get("prefix") ?? "servizio");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Nessun file." };
  if (!file.type.startsWith("image/"))
    return { ok: false, error: "Serve un'immagine." };
  if (file.size > 5 * 1024 * 1024)
    return { ok: false, error: "Immagine troppo grande (max 5MB)." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const rand = crypto.randomUUID();
  const path = `${prefix}/${rand}.${ext}`;
  const db = createAdminClient();
  const { error } = await db.storage
    .from("catalogo")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) return { ok: false, error: error.message };
  const { data } = db.storage.from("catalogo").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Crea un nuovo servizio a catalogo (bozza non attiva) e ne ritorna la chiave.
 * La chiave è uno slug del titolo, resa univoca. Solo admin.
 */
export async function createServizio(
  titolo: string,
): Promise<{ ok: true; chiave: string } | { ok: false; error: string }> {
  const err = await assertAdmin();
  if (err) return { ok: false, error: err };
  const t = titolo.trim();
  if (!t) return { ok: false, error: "Il titolo è obbligatorio." };
  const supabase = await createClient();

  // Chiave univoca: slug base, poi -2, -3, … se già esiste.
  const base = slugify(t) || "servizio";
  const { data: esistenti } = await supabase
    .from("service_catalog")
    .select("chiave")
    .like("chiave", `${base}%`);
  const prese = new Set(
    ((esistenti ?? []) as { chiave: string }[]).map((r) => r.chiave),
  );
  let chiave = base;
  for (let i = 2; prese.has(chiave); i++) chiave = `${base}-${i}`;

  // Ordine: in coda alla vetrina.
  const { data: last } = await supabase
    .from("service_catalog")
    .select("ordine")
    .order("ordine", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordine = ((last as { ordine: number } | null)?.ordine ?? 0) + 1;

  const { error } = await supabase.from("service_catalog").insert({
    chiave,
    titolo: t,
    ordine,
    attivo: false, // bozza: si pubblica dall'editor quando è pronta
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/catalogo");
  revalidatePath("/catalogo");
  return { ok: true, chiave };
}

/** Elimina un servizio a catalogo (il portfolio collegato cade in cascata). Solo admin. */
export async function deleteServizio(chiave: string): Promise<ActionResult> {
  const err = await assertAdmin();
  if (err) return { ok: false, error: err };
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_catalog")
    .delete()
    .eq("chiave", chiave);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/vendite/catalogo");
  revalidatePath("/catalogo");
  return { ok: true };
}

/** Aggiorna l'immagine di anteprima di un servizio. */
export async function setImmagineServizio(
  chiave: string,
  url: string,
): Promise<ActionResult> {
  const err = await assertAdmin();
  if (err) return { ok: false, error: err };
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_catalog")
    .update({ immagine_url: url, updated_at: new Date().toISOString() })
    .eq("chiave", chiave);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/vendite/catalogo/${chiave}`);
  revalidatePath(`/catalogo/${chiave}`);
  return { ok: true };
}
