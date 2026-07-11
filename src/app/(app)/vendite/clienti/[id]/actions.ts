"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATALOG, type OrdineSelezione } from "@/lib/catalog";

export interface AnagraficaInput {
  ragione_sociale: string;
  referente: string | null;
  email: string | null;
  telefono: string | null;
  p_iva: string | null;
  codice_fiscale: string | null;
  codice_sdi: string | null;
  pec: string | null;
  indirizzo: string | null;
}

export type UpdateResult = { ok: true } | { ok: false; error: string };

export async function updateCliente(
  clientId: string,
  input: AnagraficaInput,
): Promise<UpdateResult> {
  if (!input.ragione_sociale.trim()) {
    return { ok: false, error: "La ragione sociale è obbligatoria." };
  }
  const supabase = await createClient();
  const clean = (v: string | null) => {
    const t = (v ?? "").trim();
    return t === "" ? null : t;
  };
  const { error } = await supabase
    .from("clients")
    .update({
      ragione_sociale: input.ragione_sociale.trim(),
      referente: clean(input.referente),
      email: clean(input.email),
      telefono: clean(input.telefono),
      p_iva: clean(input.p_iva),
      codice_fiscale: clean(input.codice_fiscale),
      codice_sdi: clean(input.codice_sdi),
      pec: clean(input.pec),
      indirizzo: clean(input.indirizzo),
    })
    .eq("id", clientId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/vendite/clienti/${clientId}`);
  return { ok: true };
}

export interface CreateQuoteInput {
  clientId: string;
  tipo: "ricorrente" | "una_tantum" | "acconto";
  rataMensile?: number | null;
  rateNum?: number | null;
  importoTotale?: number | null;
  validoFino?: string | null;
  ordine: OrdineSelezione;
}

export type CreateQuoteResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

// Righe leggibili (per la pagina pubblica) derivate dalla selezione del catalogo.
function itemsFromOrdine(ordine: OrdineSelezione): string[] {
  const out: string[] = [];
  for (const svc of CATALOG) {
    const sel = ordine[svc.key];
    if (!sel?.selected) continue;
    const extra: string[] = [];
    if (sel.channels?.length) extra.push(sel.channels.join(", "));
    if (sel.tipo) extra.push(sel.tipo === "one_page" ? "One Page" : "Completo");
    if (sel.durata) extra.push(`${sel.durata} mesi`);
    if (sel.quantita) extra.push(`n. ${sel.quantita}`);
    out.push(extra.length ? `${svc.label} — ${extra.join(" · ")}` : svc.label);
  }
  return out;
}

export async function createQuote(
  input: CreateQuoteInput,
): Promise<CreateQuoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessione scaduta." };

  const descrizioni = itemsFromOrdine(input.ordine);
  if (descrizioni.length === 0) {
    return { ok: false, error: "Seleziona almeno un servizio." };
  }

  const ricorrente = input.tipo === "ricorrente";
  const importoTotale = ricorrente
    ? Number(input.rataMensile ?? 0) * Number(input.rateNum ?? 0)
    : Number(input.importoTotale ?? 0);
  if (importoTotale <= 0) return { ok: false, error: "Importo non valido." };

  const { count } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true });
  const numero = `PREV-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      client_id: input.clientId,
      numero,
      tipo: input.tipo,
      importo_totale: importoTotale,
      rata_mensile: ricorrente ? input.rataMensile : null,
      rate_num: ricorrente ? input.rateNum : null,
      valido_fino: input.validoFino || null,
      stato: "inviato",
      ordine: input.ordine,
    })
    .select("id, public_token")
    .single();

  if (error || !quote) {
    return { ok: false, error: error?.message ?? "Errore creazione preventivo." };
  }

  await supabase.from("quote_items").insert(
    descrizioni.map((d) => ({
      quote_id: quote.id,
      descrizione: d,
      quantita: 1,
      prezzo_unitario: 0,
    })),
  );

  await supabase
    .from("clients")
    .update({ stato: "preventivo_inviato" })
    .eq("id", input.clientId)
    .in("stato", ["lead"]);

  revalidatePath(`/vendite/clienti/${input.clientId}`);
  revalidatePath("/vendite");
  return { ok: true, token: quote.public_token };
}
