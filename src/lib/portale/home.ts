import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CATALOG,
  serviziDaOrdine,
  type OrdineSelezione,
} from "@/lib/catalog";
import { scadenzeServizi, giorniAllaScadenza } from "@/lib/servizi";

export interface ServizioAttivo {
  chiave: string;
  titolo: string; // titolo dal catalogo (o label del codice)
  dettaglio: string | null; // canali / durata, es. "Facebook, Instagram · 3 mesi"
  descrizione: string | null; // sottotitolo/descrizione dal catalogo
  attivita: string[]; // "cosa facciamo" — attivita_incluse dal catalogo
  unaTantum: boolean;
  scadenzaIso: string | null;
  giorni: number | null; // giorni al rinnovo (null = una tantum)
}

export interface PortaleHomeData {
  prossimaRata: {
    importo: number | null;
    numero_rata: number | null;
    scadenza: string | null;
  } | null;
  ratePagate: number;
  rateTotali: number;
  contrattiCount: number;
  serviziAttivi: ServizioAttivo[];
  serviceKeysAttivi: string[]; // per il cross-sell
  referente: string | null;
}

interface ContrRow {
  signed_at: string | null;
  quote: { ordine: OrdineSelezione | null } | null;
}

interface CatContenuto {
  chiave: string;
  titolo: string;
  sottotitolo: string | null;
  descrizione: string | null;
  attivita_incluse: string[];
}

export async function getPortaleHomeData(
  ownerId: string | null,
): Promise<PortaleHomeData> {
  const supabase = await createClient();

  const [
    { data: prossima },
    { count: rateTotali },
    { count: ratePagate },
    { count: contrattiCount },
    { data: contrData },
    { data: catData },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("numero_rata, importo, scadenza")
      .in("stato", ["scheduled", "pending"])
      .order("scadenza", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("payments").select("*", { count: "exact", head: true }),
    supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("stato", "paid"),
    supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("stato", "firmato"),
    supabase
      .from("contracts")
      .select("signed_at, quote:quotes!contracts_quote_id_fkey(ordine)")
      .eq("stato", "firmato"),
    supabase
      .from("service_catalog")
      .select("chiave, titolo, sottotitolo, descrizione, attivita_incluse"),
  ]);

  const catMap: Record<string, CatContenuto> = {};
  for (const r of (catData ?? []) as unknown as CatContenuto[])
    catMap[r.chiave] = r;

  // servizi attivi arricchiti (dai contratti firmati → ordine + catalogo)
  const byKey = new Map<string, ServizioAttivo>();
  for (const c of (contrData ?? []) as unknown as ContrRow[]) {
    const ordine = c.quote?.ordine ?? null;
    if (!ordine) continue;
    const labels = serviziDaOrdine(ordine); // allineato a CATALOG selezionati
    const scad = scadenzeServizi(ordine, c.signed_at); // stesso ordine
    let idx = 0;
    for (const svc of CATALOG) {
      if (!ordine[svc.key]?.selected) continue;
      const full = labels[idx] ?? svc.label;
      const s = scad[idx];
      idx++;
      const cat = catMap[svc.key];
      const meta =
        full.indexOf(" · ") >= 0 ? full.slice(full.indexOf(" · ") + 3) : null;
      const scadenzaIso = s?.scadenzaIso ?? null;
      const cand: ServizioAttivo = {
        chiave: svc.key,
        titolo: cat?.titolo ?? svc.label,
        dettaglio: meta,
        descrizione: cat?.sottotitolo ?? cat?.descrizione ?? null,
        attivita: cat?.attivita_incluse ?? [],
        unaTantum: s?.unaTantum ?? false,
        scadenzaIso,
        giorni: scadenzaIso ? giorniAllaScadenza(scadenzaIso) : null,
      };
      const ex = byKey.get(svc.key);
      // in caso di più contratti con lo stesso servizio, tieni il rinnovo più vicino
      if (
        !ex ||
        (cand.scadenzaIso &&
          (!ex.scadenzaIso || cand.scadenzaIso < ex.scadenzaIso))
      ) {
        byKey.set(svc.key, cand);
      }
    }
  }
  const serviziAttivi = [...byKey.values()];

  // referente (owner) — via service role: il cliente non legge profiles
  let referente: string | null = null;
  if (ownerId) {
    const admin = createAdminClient();
    const { data: prof } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", ownerId)
      .maybeSingle();
    referente = (prof as { full_name: string | null } | null)?.full_name ?? null;
  }

  return {
    prossimaRata:
      (prossima as unknown as PortaleHomeData["prossimaRata"]) ?? null,
    ratePagate: ratePagate ?? 0,
    rateTotali: rateTotali ?? 0,
    contrattiCount: contrattiCount ?? 0,
    serviziAttivi,
    serviceKeysAttivi: serviziAttivi.map((s) => s.chiave),
    referente,
  };
}
