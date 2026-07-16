"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATALOG, serviziDaOrdine, type OrdineSelezione } from "@/lib/catalog";
import { addonContributo, type Addon } from "@/lib/addon";
import type { Json } from "@/lib/database.types";

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

// Contributo al totale contratto per un servizio, dal prezzo MENSILE salvato:
// ricorrente = mensile × mesi (durata); una tantum/progetto = prezzo una volta.
function contributoDaMensile(
  key: string,
  mensile: number,
  ordine: OrdineSelezione,
): number {
  const svc = CATALOG.find((c) => c.key === key);
  if (svc?.ricorrente) return mensile * (ordine[key]?.durata ?? 12);
  return mensile;
}

// Righe preventivo (un servizio per riga, col valore di contratto) + sconto.
function buildQuoteItems(
  quoteId: string,
  ordine: OrdineSelezione,
  descrizioni: string[],
  prezziMensili: Record<string, number> | undefined,
  sconto: number,
  addons: Addon[] = [],
) {
  const selectedKeys = CATALOG.filter((c) => ordine[c.key]?.selected).map(
    (c) => c.key,
  );
  const items = descrizioni.map((d, i) => ({
    quote_id: quoteId,
    descrizione: d,
    quantita: 1,
    prezzo_unitario: contributoDaMensile(
      selectedKeys[i],
      prezziMensili?.[selectedKeys[i]] ?? 0,
      ordine,
    ),
  }));
  // Righe addon (servizi aggiuntivi a testo libero).
  for (const a of addons) {
    items.push({
      quote_id: quoteId,
      descrizione: a.descrizione,
      quantita: 1,
      prezzo_unitario: addonContributo(a),
    });
  }
  if (sconto > 0) {
    items.push({
      quote_id: quoteId,
      descrizione: "Sconto",
      quantita: 1,
      prezzo_unitario: -sconto,
    });
  }
  return items;
}

const QUOTE_EDITABILI = ["bozza", "inviato", "visto"];

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
  // prezzo per servizio selezionato (chiave→€) dal catalogo, modificabile
  prezzi?: Record<string, number>;
  // sconto in € (sulla rata se ricorrente, sull'importo altrimenti)
  sconto?: number;
  // servizi aggiuntivi a testo libero (fuori catalogo)
  addons?: Addon[];
}

export type CreateQuoteResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function createQuote(
  input: CreateQuoteInput,
): Promise<CreateQuoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessione scaduta." };

  const descrizioni = serviziDaOrdine(input.ordine);
  if (descrizioni.length === 0 && (input.addons ?? []).length === 0) {
    return { ok: false, error: "Seleziona almeno un servizio o aggiungi un addon." };
  }

  const ricorrente = input.tipo === "ricorrente";
  // Il form calcola il totale contratto (ricorrenti = mensile×mesi, una tantum
  // = prezzo, meno sconto); qui lo usiamo direttamente. La rata è totale÷n.rate.
  const importoTotale = Number(input.importoTotale ?? 0);
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
      prezzi: input.prezzi ?? {},
      sconto: input.sconto ?? 0,
      addons: (input.addons ?? []) as unknown as Json,
    })
    .select("id, public_token")
    .single();

  if (error || !quote) {
    return { ok: false, error: error?.message ?? "Errore creazione preventivo." };
  }

  const items = buildQuoteItems(
    quote.id,
    input.ordine,
    descrizioni,
    input.prezzi,
    input.sconto ?? 0,
    input.addons ?? [],
  );
  await supabase.from("quote_items").insert(items);

  await supabase
    .from("clients")
    .update({ stato: "preventivo_inviato" })
    .eq("id", input.clientId)
    .in("stato", ["lead"]);

  revalidatePath(`/vendite/clienti/${input.clientId}`);
  revalidatePath("/vendite");
  return { ok: true, token: quote.public_token };
}

export interface UpdateQuoteInput {
  quoteId: string;
  tipo: "ricorrente" | "una_tantum" | "acconto";
  rataMensile?: number | null;
  rateNum?: number | null;
  importoTotale?: number | null;
  validoFino?: string | null;
  ordine: OrdineSelezione;
  prezzi?: Record<string, number>;
  sconto?: number;
  addons?: Addon[];
}

/** Modifica un preventivo esistente — consentito finché NON è accettato/chiuso. */
export async function updateQuote(
  input: UpdateQuoteInput,
): Promise<CreateQuoteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessione scaduta." };

  const { data: existing } = await supabase
    .from("quotes")
    .select("id, stato, client_id, public_token")
    .eq("id", input.quoteId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Preventivo non trovato." };
  const q = existing as {
    id: string;
    stato: string;
    client_id: string;
    public_token: string;
  };
  if (!QUOTE_EDITABILI.includes(q.stato)) {
    return {
      ok: false,
      error:
        "Il preventivo è già stato accettato o chiuso: non è più modificabile.",
    };
  }

  const descrizioni = serviziDaOrdine(input.ordine);
  if (descrizioni.length === 0 && (input.addons ?? []).length === 0)
    return { ok: false, error: "Seleziona almeno un servizio o aggiungi un addon." };
  const ricorrente = input.tipo === "ricorrente";
  const importoTotale = Number(input.importoTotale ?? 0);
  if (importoTotale <= 0) return { ok: false, error: "Importo non valido." };

  const { error: upErr } = await supabase
    .from("quotes")
    .update({
      tipo: input.tipo,
      importo_totale: importoTotale,
      rata_mensile: ricorrente ? input.rataMensile : null,
      rate_num: ricorrente ? input.rateNum : null,
      valido_fino: input.validoFino || null,
      ordine: input.ordine,
      prezzi: input.prezzi ?? {},
      sconto: input.sconto ?? 0,
      addons: (input.addons ?? []) as unknown as Json,
    })
    .eq("id", q.id);
  if (upErr) return { ok: false, error: upErr.message };

  // Rigenera le righe (l'importo per servizio può essere cambiato).
  await supabase.from("quote_items").delete().eq("quote_id", q.id);
  const items = buildQuoteItems(
    q.id,
    input.ordine,
    descrizioni,
    input.prezzi,
    input.sconto ?? 0,
    input.addons ?? [],
  );
  await supabase.from("quote_items").insert(items);

  revalidatePath(`/vendite/clienti/${q.client_id}`);
  revalidatePath(`/vendite/preventivi/${q.id}`);
  return { ok: true, token: q.public_token };
}
