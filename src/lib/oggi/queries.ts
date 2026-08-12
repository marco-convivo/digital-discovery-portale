import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listInsoluti } from "@/lib/insoluti/queries";
import {
  STATO_META,
  isFermo,
  giorniDa,
  statoAperto,
  GIORNI_FERMO,
} from "@/lib/stati";
import type { Tone } from "@/components/ui/status-pill";
import type { ClientStato } from "@/lib/types";

/* ---- Cassa del mese (blocco denaro) ---------------------------------------- */

export interface CassaMese {
  meseLabel: string;
  incassato: number; // rate pagate con paid_at nel mese
  previsto: number; // rate con scadenza nel mese (ogni stato)
  inArrivo: number; // scheduled/pending, scadenza da oggi a fine mese
  daRecuperare: number; // insoluti aperti (importo + maggiorazione)
  rateFerme: number; // n. insoluti aperti
}

function meseCorrente() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  const next = new Date(Date.UTC(y, m + 1, 1)).toISOString().slice(0, 10);
  const oggi = now.toISOString().slice(0, 10);
  const meseLabel = new Intl.DateTimeFormat("it-IT", { month: "long" }).format(now);
  return { start, next, oggi, meseLabel };
}

const somma = (rows: { importo: number | null }[]) =>
  rows.reduce((s, r) => s + Number(r.importo ?? 0), 0);

export async function getCassaMese(): Promise<CassaMese> {
  const sb = await createClient();
  const { start, next, oggi, meseLabel } = meseCorrente();

  const [{ data: pagate }, { data: nelMese }, insoluti] = await Promise.all([
    sb
      .from("payments")
      .select("importo")
      .eq("stato", "paid")
      .gte("paid_at", start)
      .lt("paid_at", next),
    sb
      .from("payments")
      .select("importo, stato, scadenza")
      .gte("scadenza", start)
      .lt("scadenza", next),
    listInsoluti(),
  ]);

  const nel = (nelMese ?? []) as {
    importo: number | null;
    stato: string;
    scadenza: string | null;
  }[];

  return {
    meseLabel,
    incassato: somma((pagate ?? []) as { importo: number | null }[]),
    previsto: somma(nel),
    inArrivo: somma(
      nel.filter(
        (r) =>
          (r.stato === "scheduled" || r.stato === "pending") &&
          (r.scadenza ?? "") >= oggi,
      ),
    ),
    daRecuperare: insoluti.reduce(
      (s, i) => s + Number(i.importo ?? 0) + Number(i.maggiorazione ?? 0),
      0,
    ),
    rateFerme: insoluti.length,
  };
}

/* ---- Pipeline ridotta a segnale -------------------------------------------- */

export interface PipelineSegnale {
  colonne: { key: string; label: string; tone: Tone; count: number }[];
  totale: number;
  fermiCount: number;
}

export async function getPipelineSegnale(): Promise<PipelineSegnale> {
  const sb = await createClient();
  const [{ data: cli }, { data: log }] = await Promise.all([
    sb.from("clients").select("id, stato, created_at"),
    sb
      .from("activity_log")
      .select("client_id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const clients = (cli ?? []) as {
    id: string;
    stato: ClientStato;
    created_at: string;
  }[];
  const ultimo = new Map<string, string>();
  for (const l of (log ?? []) as { client_id: string | null; created_at: string }[]) {
    if (l.client_id && !ultimo.has(l.client_id)) ultimo.set(l.client_id, l.created_at);
  }

  // Colonne "aperte" del funnel (esclude persi/cessati dal conteggio-segnale).
  const APERTI: { key: string; label: string; tone: Tone; stato: ClientStato }[] = [
    { key: "lead", label: "Lead", tone: "draft", stato: "lead" },
    { key: "trattativa", label: "In trattativa", tone: "wait", stato: "in_trattativa" },
    { key: "attivazione", label: "In attivazione", tone: "info", stato: "in_attivazione" },
    { key: "attivo", label: "Attivo", tone: "paid", stato: "attivo" },
  ];

  const colonne = APERTI.map((c) => ({
    key: c.key,
    label: c.label,
    tone: c.tone,
    count: clients.filter((cl) => cl.stato === c.stato).length,
  }));

  const fermiCount = clients.filter((cl) =>
    isFermo(cl.stato, ultimo.get(cl.id) ?? cl.created_at),
  ).length;

  return {
    colonne,
    totale: clients.filter((c) => statoAperto(c.stato)).length,
    fermiCount,
  };
}

/* ---- Coda di lavoro / Da chiudere ------------------------------------------ */

export type CodaGruppo = "soldi_fermi" | "ferme" | "movimento";
export type CodaTipo = "insoluto" | "firma" | "preventivo_visto" | "preventivo_inviato" | "fermo" | "lead";

export interface CodaItem {
  key: string;
  clientId: string;
  ragioneSociale: string;
  tone: Tone;
  statoLabel: string;
  situazione: string;
  giorni: number | null;
  importo: number | null;
  azione: { label: string; href: string };
  gruppo: CodaGruppo;
  urgenza: number;
}

const GRUPPO_LABEL: Record<CodaGruppo, { label: string; tone: Tone }> = {
  soldi_fermi: { label: "Soldi fermi", tone: "fail" },
  ferme: { label: "Ferme da 14+ giorni", tone: "wait" },
  movimento: { label: "In movimento", tone: "info" },
};

/**
 * L'elenco di ciò che va chiuso, un elemento per cliente (situazione più
 * urgente). Fonti: insoluti, contratti da firmare, preventivi inviati/visti,
 * trattative ferme, lead senza preventivo.
 */
export async function getCodaLavoro(): Promise<CodaItem[]> {
  const sb = await createClient();

  const [
    insoluti,
    { data: contrattiRaw },
    { data: quotesRaw },
    { data: cliRaw },
    { data: logRaw },
  ] = await Promise.all([
    listInsoluti(),
    sb
      .from("contracts")
      .select(
        "id, client_id, stato, created_at, client:clients!contracts_client_id_fkey(id, ragione_sociale), quote:quotes!contracts_quote_id_fkey(importo_totale)",
      )
      .eq("stato", "inviato"),
    sb
      .from("quotes")
      .select(
        "id, client_id, stato, importo_totale, created_at, public_token, client:clients!quotes_client_id_fkey(id, ragione_sociale)",
      )
      .in("stato", ["inviato", "visto"]),
    sb.from("clients").select("id, ragione_sociale, stato, created_at"),
    sb
      .from("activity_log")
      .select("client_id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const clients = (cliRaw ?? []) as {
    id: string;
    ragione_sociale: string;
    stato: ClientStato;
    created_at: string;
  }[];
  const cliById = new Map(clients.map((c) => [c.id, c]));

  const ultimo = new Map<string, string>();
  for (const l of (logRaw ?? []) as { client_id: string | null; created_at: string }[]) {
    if (l.client_id && !ultimo.has(l.client_id)) ultimo.set(l.client_id, l.created_at);
  }
  const ultimoMov = (id: string) => ultimo.get(id) ?? cliById.get(id)?.created_at ?? null;

  // Clienti che hanno almeno un preventivo (per rilevare i lead "nudi").
  const conPreventivo = new Set(
    ((quotesRaw ?? []) as { client_id: string }[]).map((q) => q.client_id),
  );

  const items: CodaItem[] = [];
  const push = (it: CodaItem) => items.push(it);

  // 1) Insoluti → soldi fermi (il segnale più forte).
  for (const i of insoluti) {
    if (!i.client) continue;
    const gg = giorniDa(i.failed_at);
    push({
      key: `${i.client.id}:insoluto`,
      clientId: i.client.id,
      ragioneSociale: i.client.ragione_sociale,
      tone: "fail",
      statoLabel: "Insoluto",
      situazione: `Rata ${i.numero_rata ?? "—"} non incassata · ${gg} giorni`,
      giorni: gg,
      importo: Number(i.importo ?? 0) + Number(i.maggiorazione ?? 0),
      azione: { label: "Recupera", href: "/vendite/insoluti" },
      gruppo: "soldi_fermi",
      urgenza: 100 + gg,
    });
  }

  // 2) Contratti da firmare → in movimento.
  for (const c of (contrattiRaw ?? []) as {
    id: string;
    client_id: string;
    created_at: string;
    client: { id: string; ragione_sociale: string } | null;
    quote: { importo_totale: number | null } | null;
  }[]) {
    if (!c.client) continue;
    const gg = giorniDa(c.created_at);
    push({
      key: `${c.client.id}:firma`,
      clientId: c.client.id,
      ragioneSociale: c.client.ragione_sociale,
      tone: "info",
      statoLabel: "Contratto",
      situazione:
        gg <= 1 ? "Contratto inviato, in attesa di firma" : `Contratto da firmare · ${gg} giorni`,
      giorni: gg,
      importo: c.quote?.importo_totale ?? null,
      azione: { label: "Ricorda", href: `/vendite/clienti/${c.client.id}` },
      gruppo: "movimento",
      urgenza: 60,
    });
  }

  // 3) Preventivi inviati/visti → movimento (visto) o ferme (inviato e vecchio).
  for (const q of (quotesRaw ?? []) as {
    id: string;
    client_id: string;
    stato: string;
    importo_totale: number | null;
    created_at: string;
    client: { id: string; ragione_sociale: string } | null;
  }[]) {
    if (!q.client) continue;
    const gg = giorniDa(q.created_at);
    const vecchio = gg >= GIORNI_FERMO;
    if (q.stato === "visto") {
      push({
        key: `${q.client.id}:preventivo_visto`,
        clientId: q.client.id,
        ragioneSociale: q.client.ragione_sociale,
        tone: "wait",
        statoLabel: "Visto",
        situazione: `Ha aperto il preventivo · ${gg} giorni`,
        giorni: gg,
        importo: q.importo_totale,
        azione: { label: "Chiama", href: `/vendite/clienti/${q.client.id}` },
        gruppo: "movimento",
        urgenza: 55,
      });
    } else {
      push({
        key: `${q.client.id}:preventivo_inviato`,
        clientId: q.client.id,
        ragioneSociale: q.client.ragione_sociale,
        tone: "wait",
        statoLabel: "Preventivo",
        situazione: `Preventivo inviato, mai aperto · ${gg} giorni`,
        giorni: gg,
        importo: q.importo_totale,
        azione: { label: "Sollecita", href: `/vendite/clienti/${q.client.id}` },
        gruppo: vecchio ? "ferme" : "movimento",
        urgenza: vecchio ? 70 : 50,
      });
    }
  }

  // 4) Trattative ferme 14+ e lead senza preventivo → ferme.
  for (const c of clients) {
    if (!statoAperto(c.stato)) continue;
    const mov = ultimoMov(c.id);
    const gg = giorniDa(mov);
    const senzaPrev = c.stato === "lead" && !conPreventivo.has(c.id);
    if (senzaPrev) {
      push({
        key: `${c.id}:lead`,
        clientId: c.id,
        ragioneSociale: c.ragione_sociale,
        tone: "wait",
        statoLabel: "Lead",
        situazione: `Lead senza preventivo · ${gg} giorni`,
        giorni: gg,
        importo: null,
        azione: { label: "Preventivo", href: `/vendite/preventivo/${c.id}` },
        gruppo: gg >= GIORNI_FERMO ? "ferme" : "movimento",
        urgenza: gg >= GIORNI_FERMO ? 65 : 20,
      });
    } else if (isFermo(c.stato, mov)) {
      push({
        key: `${c.id}:fermo`,
        clientId: c.id,
        ragioneSociale: c.ragione_sociale,
        tone: "wait",
        statoLabel: STATO_META[c.stato].label,
        situazione: `${STATO_META[c.stato].label} · fermo da ${gg} giorni`,
        giorni: gg,
        importo: null,
        azione: { label: "Apri", href: `/vendite/clienti/${c.id}` },
        gruppo: "ferme",
        urgenza: 64,
      });
    }
  }

  // Un elemento per cliente: tiene la situazione più urgente.
  const perCliente = new Map<string, CodaItem>();
  for (const it of items) {
    const cur = perCliente.get(it.clientId);
    if (!cur || it.urgenza > cur.urgenza) perCliente.set(it.clientId, it);
  }
  return [...perCliente.values()].sort((a, b) => b.urgenza - a.urgenza);
}

export function raggruppaCoda(items: CodaItem[]) {
  const ordine: CodaGruppo[] = ["soldi_fermi", "ferme", "movimento"];
  return ordine
    .map((g) => ({
      gruppo: g,
      ...GRUPPO_LABEL[g],
      items: items.filter((i) => i.gruppo === g),
    }))
    .filter((s) => s.items.length > 0);
}

/* ---- Movimenti recenti (registro) ------------------------------------------ */

export interface MovimentoRecente {
  id: string;
  ragioneSociale: string;
  cosa: string;
  aStato: string | null;
  tone: Tone;
  created_at: string;
}

export async function getMovimentiRecenti(limit = 6): Promise<MovimentoRecente[]> {
  const sb = await createClient();
  const { data } = await sb
    .from("activity_log")
    .select(
      "id, azione, da_stato, a_stato, created_at, client:clients!activity_log_client_id_fkey(ragione_sociale)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as {
    id: string;
    azione: string | null;
    da_stato: string | null;
    a_stato: string | null;
    created_at: string;
    client: { ragione_sociale: string } | null;
  }[]).map((r) => {
    const meta = r.a_stato ? STATO_META[r.a_stato as ClientStato] : null;
    const cosa =
      (r.azione && r.azione.trim()) ||
      (meta ? `Passato a ${meta.label.toLowerCase()}` : "Aggiornamento");
    return {
      id: r.id,
      ragioneSociale: r.client?.ragione_sociale ?? "—",
      cosa,
      aStato: meta?.label ?? null,
      tone: meta?.tone ?? "draft",
      created_at: r.created_at,
    };
  });
}
