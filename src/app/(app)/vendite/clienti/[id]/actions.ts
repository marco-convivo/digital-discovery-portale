"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CreateQuoteInput {
  clientId: string;
  tipo: "ricorrente" | "una_tantum" | "acconto";
  rataMensile?: number | null;
  rateNum?: number | null;
  importoTotale?: number | null;
  validoFino?: string | null;
  items: { descrizione: string; prezzo: number }[];
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

  const ricorrente = input.tipo === "ricorrente";
  const importoTotale = ricorrente
    ? Number(input.rataMensile ?? 0) * Number(input.rateNum ?? 0)
    : Number(input.importoTotale ?? 0);

  if (importoTotale <= 0) {
    return { ok: false, error: "Importo non valido." };
  }

  // numero progressivo PREV-<anno>-<seq>
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
    })
    .select("id, public_token")
    .single();

  if (error || !quote) {
    return { ok: false, error: error?.message ?? "Errore creazione preventivo." };
  }

  const items = input.items
    .filter((it) => it.descrizione.trim() !== "")
    .map((it) => ({
      quote_id: quote.id,
      descrizione: it.descrizione.trim(),
      quantita: 1,
      prezzo_unitario: Number(it.prezzo) || 0,
    }));
  if (items.length > 0) {
    await supabase.from("quote_items").insert(items);
  }

  // Avanza la pratica: lead/prospect → preventivo_inviato.
  await supabase
    .from("clients")
    .update({ stato: "preventivo_inviato" })
    .eq("id", input.clientId)
    .in("stato", ["lead"]);

  revalidatePath(`/vendite/clienti/${input.clientId}`);
  revalidatePath("/vendite");
  return { ok: true, token: quote.public_token };
}
