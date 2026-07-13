import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATALOG, type OrdineSelezione } from "@/lib/catalog";
import { scadenzeServizi, giorniAllaScadenza } from "@/lib/servizi";

export interface ServizioAttivo {
  label: string;
  unaTantum: boolean;
  scadenzaIso: string | null;
  giorni: number | null; // giorni alla scadenza (null = una tantum)
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
  serviceKeysAttivi: string[]; // per il cross-sell (servizi non ancora attivi)
  referente: string | null; // nome del commerciale assegnato (owner)
}

interface ContrRow {
  signed_at: string | null;
  quote: { ordine: OrdineSelezione | null } | null;
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
      .select(
        "signed_at, quote:quotes!contracts_quote_id_fkey(ordine)",
      )
      .eq("stato", "firmato"),
  ]);

  // servizi attivi + chiavi (dai contratti firmati → ordine)
  const serviziAttivi: ServizioAttivo[] = [];
  const keys = new Set<string>();
  for (const c of (contrData ?? []) as unknown as ContrRow[]) {
    const ordine = c.quote?.ordine ?? null;
    for (const s of scadenzeServizi(ordine, c.signed_at)) {
      serviziAttivi.push({
        label: s.label,
        unaTantum: s.unaTantum,
        scadenzaIso: s.scadenzaIso,
        giorni: s.scadenzaIso ? giorniAllaScadenza(s.scadenzaIso) : null,
      });
    }
    if (ordine) {
      for (const svc of CATALOG) if (ordine[svc.key]?.selected) keys.add(svc.key);
    }
  }

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
    serviceKeysAttivi: [...keys],
    referente,
  };
}
