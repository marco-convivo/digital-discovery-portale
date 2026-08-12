import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  getPrezziBase,
  getServiziExtra,
  type ServizioExtra,
} from "@/lib/catalogo/queries";
import { dataIt } from "@/lib/format";
import { serviziDettaglio } from "@/lib/catalog";
import { addMesi } from "@/lib/preventivi/genera-rate";
import { giorniAllaScadenza } from "@/lib/servizi";
import { parseAddons } from "@/lib/addon";
import type { PreventivoItem } from "@/components/internal/preventivi-list";
import type { FatturaRow } from "@/components/internal/fatture-cliente";
import type { RataRow } from "@/components/internal/piano-pagamenti";
import type { PianoGruppo } from "@/components/internal/piani-pagamento";
import type { AllegatoRow } from "@/components/internal/allegati-cliente";
import type { OrdineSelezione } from "@/lib/catalog";
import type { Client } from "@/lib/types";

export interface ServizioAttivo {
  label: string;
  meta: string; // "fino al …" / "in scadenza · N gg" / "una tantum"
  inScadenza: boolean;
  incluse: string[]; // "cosa facciamo" dal catalogo
  descrizione: string | null; // descrizione catalogo o testo della voce custom
  custom: boolean; // true = voce libera (addon), non da catalogo
}

export interface ContractRow {
  id: string;
  stato: string;
  signed_at: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  quote: { ordine: OrdineSelezione | null } | null;
}

export interface AttivitaRow {
  id: string;
  azione: string;
  da_stato: string | null;
  a_stato: string | null;
  created_at: string;
}

export interface ClienteSchedaData {
  client: Client;
  prezziBase: Awaited<ReturnType<typeof getPrezziBase>>;
  serviziExtra: ServizioExtra[];
  quotes: PreventivoItem[];
  contratti: ContractRow[];
  fatture: FatturaRow[];
  gruppiPagamenti: PianoGruppo[];
  attivita: AttivitaRow[];
  allegati: AllegatoRow[];
  serviziAttivi: ServizioAttivo[];
  isAdmin: boolean;
}

/** Dati completi della scheda cliente, condivisi tra pagina intera e pannello. */
export async function getClienteScheda(
  id: string,
): Promise<ClienteSchedaData | null> {
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!client) return null;
  const c = client as Client;

  const [prezziBase, serviziExtra] = await Promise.all([
    getPrezziBase(),
    getServiziExtra(),
  ]);

  // Ruolo dell'utente corrente (per gestire azioni riservate all'admin).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", user.id)
      .maybeSingle();
    const pr = prof as { role: string; active: boolean } | null;
    isAdmin = !!pr && pr.active && pr.role === "admin";
  }

  const [
    { data: quotesData },
    { data: payData },
    { data: contrData },
    { data: invData },
    { data: logData },
    { data: allegatiData },
    { data: catData },
  ] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, numero, stato, importo_totale, public_token, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, numero_rata, importo, scadenza, stato, contract_id, subscription_id")
      .eq("client_id", id)
      .order("numero_rata", { ascending: true }),
    supabase
      .from("contracts")
      .select(
        "id, stato, signed_at, signed_pdf_url, created_at, quote:quotes!contracts_quote_id_fkey(ordine, addons)",
      )
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, numero, data, importo, pdf_url")
      .eq("client_id", id)
      .order("data", { ascending: false }),
    supabase
      .from("activity_log")
      .select("id, azione, da_stato, a_stato, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("client_attachments")
      .select("id, nome, tipo, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("service_catalog")
      .select("chiave, attivita_incluse, descrizione"),
  ]);

  const quotes = (quotesData ?? []) as unknown as PreventivoItem[];
  const contratti = (contrData ?? []) as unknown as ContractRow[];
  const fatture = (invData ?? []) as unknown as FatturaRow[];
  const attivita = (logData ?? []) as unknown as AttivitaRow[];
  const allegati = (allegatiData ?? []) as unknown as AllegatoRow[];

  const pays = (payData ?? []) as unknown as (RataRow & {
    contract_id: string | null;
    subscription_id: string | null;
  })[];
  const NONE = "__none__";
  const gruppiPagamenti: PianoGruppo[] = Array.from(
    pays.reduce((map, p) => {
      const k = p.contract_id ?? NONE;
      const g = map.get(k) ?? { rate: [] as RataRow[], manuale: true };
      g.rate.push({
        id: p.id,
        numero_rata: p.numero_rata,
        importo: p.importo,
        scadenza: p.scadenza,
        stato: p.stato,
      });
      if (p.subscription_id) g.manuale = false;
      map.set(k, g);
      return map;
    }, new Map<string, { rate: RataRow[]; manuale: boolean }>()),
  ).map(([k, g]) => {
    const contract = k === NONE ? null : (contratti.find((c) => c.id === k) ?? null);
    const label = contract
      ? contract.signed_at
        ? `Contratto · firmato il ${dataIt(contract.signed_at)}`
        : "Contratto"
      : "Piano";
    return { key: k, label, rate: g.rate, manuale: g.manuale };
  });

  // --- Servizi attivi (con "cosa comprende" + scadenza per periodo) ----------
  // Contenuti catalogo per chiave (attività incluse + descrizione).
  const catMap = new Map<string, { incluse: string[]; descrizione: string | null }>();
  for (const r of (catData ?? []) as {
    chiave: string;
    attivita_incluse: string[] | null;
    descrizione: string | null;
  }[]) {
    catMap.set(r.chiave, {
      incluse: r.attivita_incluse ?? [],
      descrizione: r.descrizione,
    });
  }
  // Fine del piano per contratto (ultima rata) → scadenza per le una tantum.
  const finePiano = new Map<string, string>();
  for (const g of gruppiPagamenti) {
    const max = g.rate.reduce((m, r) => (r.scadenza && r.scadenza > m ? r.scadenza : m), "");
    if (max) finePiano.set(g.key, max);
  }

  interface Raw {
    label: string;
    scadenzaIso: string | null;
    incluse: string[];
    descrizione: string | null;
    custom: boolean;
  }
  const perLabel = new Map<string, Raw>();
  const contrRaw = (contrData ?? []) as unknown as {
    id: string;
    stato: string;
    signed_at: string | null;
    quote: { ordine: OrdineSelezione | null; addons: unknown } | null;
  }[];
  for (const ct of contrRaw) {
    if (ct.stato !== "firmato" && ct.stato !== "completato") continue;
    const dett = serviziDettaglio(ct.quote?.ordine ?? null);
    const addons = parseAddons(ct.quote?.addons);
    const firma = ct.signed_at;
    // Scadenza del contratto = la più lontana tra i ricorrenti (catalogo+addon)
    // e la fine del piano rate.
    const cand: string[] = [];
    for (const d of dett) if (!d.unaTantum && firma) cand.push(addMesi(firma, d.durataMesi ?? 12));
    for (const a of addons) if (a.tipo === "ricorrente" && firma) cand.push(addMesi(firma, a.durata ?? 12));
    const fp = finePiano.get(ct.id);
    if (fp) cand.push(fp);
    const contrattoScadenza = cand.length ? cand.sort().at(-1)! : null;

    const add = (raw: Raw) => {
      const cur = perLabel.get(raw.label);
      if (!cur || (raw.scadenzaIso ?? "") > (cur.scadenzaIso ?? ""))
        perLabel.set(raw.label, raw);
    };
    for (const d of dett) {
      const content = catMap.get(d.key);
      add({
        label: d.label,
        scadenzaIso: d.unaTantum ? contrattoScadenza : firma ? addMesi(firma, d.durataMesi ?? 12) : null,
        incluse: content?.incluse ?? [],
        descrizione: content?.descrizione ?? null,
        custom: false,
      });
    }
    for (const a of addons) {
      add({
        label: a.descrizione,
        scadenzaIso: a.tipo === "ricorrente" ? (firma ? addMesi(firma, a.durata ?? 12) : null) : contrattoScadenza,
        incluse: [],
        descrizione: a.descrizione,
        custom: true,
      });
    }
  }

  const serviziAttivi: ServizioAttivo[] = [...perLabel.values()].flatMap((s) => {
    if (s.scadenzaIso && giorniAllaScadenza(s.scadenzaIso) < 0) return [];
    const gg = s.scadenzaIso ? giorniAllaScadenza(s.scadenzaIso) : null;
    const inScadenza = gg != null && gg <= 30;
    const meta = s.scadenzaIso
      ? inScadenza
        ? `in scadenza · ${gg} gg`
        : `fino al ${dataIt(s.scadenzaIso)}`
      : "una tantum";
    return [
      {
        label: s.label,
        meta,
        inScadenza,
        incluse: s.incluse,
        descrizione: s.descrizione,
        custom: s.custom,
      },
    ];
  });

  return {
    client: c,
    prezziBase,
    serviziExtra,
    quotes,
    contratti,
    fatture,
    gruppiPagamenti,
    attivita,
    allegati,
    serviziAttivi,
    isAdmin,
  };
}
