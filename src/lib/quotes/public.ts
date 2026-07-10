import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Il preventivo pubblico gira in contesto anon: admin client scoping sul token.

export interface PublicQuote {
  numero: string | null;
  tipo: string;
  stato: string;
  importo_totale: number | null;
  rata_mensile: number | null;
  rate_num: number | null;
  valido_fino: string | null;
  created_at: string;
  ragioneSociale: string;
  items: {
    descrizione: string;
    quantita: number;
    prezzo_unitario: number;
  }[];
}

interface RawQuote {
  id: string;
  client_id: string;
  numero: string | null;
  tipo: string;
  stato: string;
  importo_totale: number | null;
  rata_mensile: number | null;
  rate_num: number | null;
  valido_fino: string | null;
  viewed_at: string | null;
  created_at: string;
  items: PublicQuote["items"] | null;
  client: { id: string; ragione_sociale: string; stato: string } | null;
}

async function loadRaw(token: string): Promise<RawQuote | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("quotes")
    .select(
      "id, client_id, numero, tipo, stato, importo_totale, rata_mensile, rate_num, valido_fino, viewed_at, created_at, items:quote_items(descrizione, quantita, prezzo_unitario), client:clients!quotes_client_id_fkey(id, ragione_sociale, stato)",
    )
    .eq("public_token", token)
    .maybeSingle();
  return data as unknown as RawQuote | null;
}

/** Carica il preventivo per il token e, alla prima apertura, segna "visto". */
export async function getPublicQuote(token: string): Promise<PublicQuote | null> {
  const q = await loadRaw(token);
  if (!q || !q.client) return null;
  const client = q.client as unknown as {
    id: string;
    ragione_sociale: string;
    stato: string;
  };

  const db = createAdminClient();

  // Segna la visione una sola volta e avanza lo stato solo se era "inviato".
  if (!q.viewed_at) {
    await db
      .from("quotes")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", q.id);
    if (q.stato === "inviato") {
      await db.from("quotes").update({ stato: "visto" }).eq("id", q.id);
    }
    if (client.stato === "preventivo_inviato") {
      await db
        .from("clients")
        .update({ stato: "preventivo_visto" })
        .eq("id", client.id);
    }
  }

  const items =
    (q.items as unknown as PublicQuote["items"] | null)?.slice() ?? [];

  return {
    numero: q.numero,
    tipo: q.tipo,
    stato: q.stato,
    importo_totale: q.importo_totale,
    rata_mensile: q.rata_mensile,
    rate_num: q.rate_num,
    valido_fino: q.valido_fino,
    created_at: q.created_at,
    ragioneSociale: client.ragione_sociale,
    items,
  };
}

export type AcceptResult =
  | { ok: true }
  | { ok: false; error: string };

/** Accettazione del preventivo → quote 'accettato' + cliente 'preventivo_accettato'. */
export async function acceptQuote(token: string): Promise<AcceptResult> {
  const q = await loadRaw(token);
  if (!q || !q.client) return { ok: false, error: "Preventivo non trovato." };
  const client = q.client as unknown as { id: string; stato: string };

  if (q.stato === "accettato") return { ok: true }; // idempotente
  if (!["inviato", "visto"].includes(q.stato)) {
    return { ok: false, error: "Questo preventivo non è più accettabile." };
  }

  const db = createAdminClient();
  await db
    .from("quotes")
    .update({ stato: "accettato", accepted_at: new Date().toISOString() })
    .eq("id", q.id);

  // Avanza il cliente (il prossimo passo — contratto DocuSeal — arriverà dopo).
  if (["preventivo_inviato", "preventivo_visto"].includes(client.stato)) {
    await db
      .from("clients")
      .update({ stato: "preventivo_accettato" })
      .eq("id", client.id);
  }
  return { ok: true };
}
