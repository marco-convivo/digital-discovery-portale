"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviaAccessoPortale } from "@/lib/portale/welcome";
import type { OrdineSelezione } from "@/lib/catalog";

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

function addMonths(iso: string, m: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + m);
  return d.toISOString().slice(0, 10);
}

/** Upload del PDF del contratto firmato (bucket pubblico `contratti`). Solo staff. */
export async function uploadContrattoPdf(
  form: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const staff = await currentStaffId();
  if (!staff) return { ok: false, error: "Accesso non abilitato." };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Nessun file." };
  if (file.type !== "application/pdf")
    return { ok: false, error: "Serve un PDF." };
  if (file.size > 15 * 1024 * 1024)
    return { ok: false, error: "PDF troppo grande (max 15MB)." };

  const path = `firmati/${crypto.randomUUID()}.pdf`;
  const db = createAdminClient();
  const { error } = await db.storage
    .from("contratti")
    .upload(path, file, { contentType: "application/pdf", upsert: true });
  if (error) return { ok: false, error: error.message };
  const { data } = db.storage.from("contratti").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/** Invia al cliente l'email con il link di accesso al portale (magic link). */
export async function inviaAccessoCliente(
  clientId: string,
): Promise<ActionResult> {
  const staff = await currentStaffId();
  if (!staff) return { ok: false, error: "Accesso non abilitato." };
  const db = createAdminClient();
  const { data } = await db
    .from("clients")
    .select("email")
    .eq("id", clientId)
    .maybeSingle();
  const email = (data as { email: string | null } | null)?.email;
  if (!email)
    return { ok: false, error: "Il cliente non ha un'email: aggiungila prima." };
  await inviaAccessoPortale(email);
  return { ok: true };
}

export interface ClienteEsistenteInput {
  ragione_sociale: string;
  email: string | null;
  referente: string | null;
  telefono: string | null;
  p_iva: string | null;
  codice_fiscale: string | null;
  codice_sdi: string | null;
  pec: string | null;
  indirizzo: string | null;
  ordine: OrdineSelezione;
  firmatoIl: string; // YYYY-MM-DD
  signedPdfUrl: string | null;
  rataMensile: number;
  rateNum: number;
  primaScadenza: string; // YYYY-MM-DD
}

/**
 * Onboarding manuale di un cliente GIÀ attivo (contratto siglato + SDD esterno,
 * es. Banca Sella). Crea cliente + preventivo(accettato) + contratto(firmato) +
 * piano rate manuale (nessuna subscription Stripe). Le rate si segnano pagate a
 * mano man mano che la banca addebita. Solo staff.
 */
export async function creaClienteEsistente(
  input: ClienteEsistenteInput,
): Promise<{ ok: true; clientId: string } | { ok: false; error: string }> {
  const staffId = await currentStaffId();
  if (!staffId) return { ok: false, error: "Accesso non abilitato." };

  const nome = input.ragione_sociale.trim();
  if (!nome) return { ok: false, error: "La ragione sociale è obbligatoria." };
  const rata = Number(input.rataMensile);
  const rateNum = Math.trunc(Number(input.rateNum));
  if (!(rata > 0)) return { ok: false, error: "Importo rata non valido." };
  if (!(rateNum >= 1 && rateNum <= 60))
    return { ok: false, error: "Numero rate non valido (1–60)." };
  if (!input.primaScadenza)
    return { ok: false, error: "Indica la data della prima rata." };
  if (!input.firmatoIl)
    return { ok: false, error: "Indica la data di firma del contratto." };

  const clean = (v: string | null) => {
    const t = (v ?? "").trim();
    return t === "" ? null : t;
  };
  const db = createAdminClient();

  // 1) Cliente attivo
  const { data: cliRow, error: cliErr } = await db
    .from("clients")
    .insert({
      ragione_sociale: nome,
      email: clean(input.email),
      referente: clean(input.referente),
      telefono: clean(input.telefono),
      p_iva: clean(input.p_iva),
      codice_fiscale: clean(input.codice_fiscale),
      codice_sdi: clean(input.codice_sdi),
      pec: clean(input.pec),
      indirizzo: clean(input.indirizzo),
      stato: "cliente_attivo",
      owner_id: staffId,
    })
    .select("id")
    .single();
  if (cliErr || !cliRow)
    return { ok: false, error: cliErr?.message ?? "Errore creazione cliente." };
  const clientId = (cliRow as { id: string }).id;

  // 2) Preventivo "accettato" — tiene i servizi (ordine) per il portale
  const { count } = await db
    .from("quotes")
    .select("*", { count: "exact", head: true });
  const numero = `PREV-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(3, "0")}`;
  const importoTotale = Math.round(rata * rateNum * 100) / 100;
  const { data: quoteRow } = await db
    .from("quotes")
    .insert({
      client_id: clientId,
      numero,
      tipo: "ricorrente",
      importo_totale: importoTotale,
      rata_mensile: rata,
      rate_num: rateNum,
      stato: "accettato",
      accepted_at: new Date().toISOString(),
      ordine: input.ordine,
    })
    .select("id")
    .single();
  const quoteId = (quoteRow as { id: string } | null)?.id ?? null;

  // 3) Contratto firmato (con eventuale PDF)
  const { data: contrRow } = await db
    .from("contracts")
    .insert({
      client_id: clientId,
      quote_id: quoteId,
      stato: "firmato",
      signed_at: input.firmatoIl,
      signed_pdf_url: input.signedPdfUrl,
    })
    .select("id")
    .single();
  const contractId = (contrRow as { id: string } | null)?.id ?? null;

  // 4) Payment setup manuale (SDD esterno, nessuno Stripe)
  await db.from("payment_setups").insert({
    client_id: clientId,
    contract_id: contractId,
    metodo: "sdd",
    stato: "manuale",
  });

  // 5) Rate mensili "scheduled" — nessuna subscription
  const rows = Array.from({ length: rateNum }, (_, i) => ({
    client_id: clientId,
    contract_id: contractId,
    numero_rata: i + 1,
    importo: rata,
    scadenza: addMonths(input.primaScadenza, i),
    stato: "scheduled" as const,
  }));
  await db.from("payments").insert(rows);

  revalidatePath("/vendite/clienti");
  revalidatePath(`/vendite/clienti/${clientId}`);
  return { ok: true, clientId };
}
