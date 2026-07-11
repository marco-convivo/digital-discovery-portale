import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATALOG, serviziDaOrdine, type OrdineSelezione } from "@/lib/catalog";

// Il preventivo pubblico gira in contesto anon: admin client scoping sul token.

// Servizio arricchito coi contenuti del catalogo (per spiegarlo al cliente).
export interface QuoteServizio {
  titolo: string;
  meta: string | null; // canali/durata, es. "Facebook, Instagram · 3 mesi"
  descrizione: string | null;
  attivita: string[]; // poche voci chiave
  prezzo: number; // valore di contratto della riga
}

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
  servizi: QuoteServizio[];
  sconto: number; // >0 se applicato
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
  ordine: unknown;
  items: PublicQuote["items"] | null;
  client: { id: string; ragione_sociale: string; stato: string } | null;
}

async function loadRaw(token: string): Promise<RawQuote | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("quotes")
    .select(
      "id, client_id, numero, tipo, stato, importo_totale, rata_mensile, rate_num, valido_fino, viewed_at, created_at, ordine, items:quote_items(descrizione, quantita, prezzo_unitario), client:clients!quotes_client_id_fkey(id, ragione_sociale, stato)",
    )
    .eq("public_token", token)
    .maybeSingle();
  return data as unknown as RawQuote | null;
}

interface CatalogContenuto {
  chiave: string;
  titolo: string;
  sottotitolo: string | null;
  descrizione: string | null;
  attivita_incluse: string[];
}

/** Costruisce i servizi arricchiti dal preventivo + contenuti del catalogo. */
async function buildServizi(
  ordineRaw: unknown,
  items: PublicQuote["items"],
): Promise<QuoteServizio[]> {
  const ordine = (ordineRaw ?? null) as OrdineSelezione | null;
  if (ordine) {
    const selectedKeys = CATALOG.filter((c) => ordine[c.key]?.selected).map(
      (c) => c.key,
    );
    const labels = serviziDaOrdine(ordine); // allineato a selectedKeys
    const labelToKey = new Map<string, string>();
    const metaByKey = new Map<string, string | null>();
    selectedKeys.forEach((k, i) => {
      const full = labels[i] ?? "";
      labelToKey.set(full, k);
      const idx = full.indexOf(" · ");
      metaByKey.set(k, idx >= 0 ? full.slice(idx + 3) : null);
    });
    // prezzo per servizio: match per etichetta (robusto all'ordine delle righe)
    const priceByKey = new Map<string, number>();
    for (const it of items) {
      if (it.descrizione === "Sconto") continue;
      const k = labelToKey.get(it.descrizione);
      if (k) priceByKey.set(k, it.prezzo_unitario);
    }
    const catMap: Record<string, CatalogContenuto> = {};
    if (selectedKeys.length) {
      const db = createAdminClient();
      const { data: cat } = await db
        .from("service_catalog")
        .select("chiave, titolo, sottotitolo, descrizione, attivita_incluse")
        .in("chiave", selectedKeys);
      for (const r of (cat ?? []) as unknown as CatalogContenuto[])
        catMap[r.chiave] = r;
    }
    const servizi = selectedKeys.map((key) => {
      const c = catMap[key];
      return {
        titolo: c?.titolo ?? key,
        meta: metaByKey.get(key) ?? null,
        descrizione: c?.sottotitolo ?? c?.descrizione ?? null,
        attivita: (c?.attivita_incluse ?? []).slice(0, 3),
        prezzo: priceByKey.get(key) ?? 0,
      };
    });
    if (servizi.length) return servizi;
  }
  // Fallback (preventivi vecchi senza `ordine`): solo etichetta + prezzo.
  return items
    .filter((it) => it.descrizione !== "Sconto")
    .map((it) => ({
      titolo: it.descrizione,
      meta: null,
      descrizione: null,
      attivita: [],
      prezzo: it.prezzo_unitario,
    }));
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

  const servizi = await buildServizi(q.ordine, items);
  const scontoItem = items.find((it) => it.descrizione === "Sconto");
  const sconto = scontoItem ? Math.abs(scontoItem.prezzo_unitario) : 0;

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
    servizi,
    sconto,
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
