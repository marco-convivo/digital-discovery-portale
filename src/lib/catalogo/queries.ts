import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CATALOG } from "@/lib/catalog";
import type {
  ServiceCatalogRow,
  PortfolioItemRow,
  VetrinaServizio,
} from "@/lib/catalogo/types";

const SERVICE_COLS =
  "id, chiave, titolo, sottotitolo, descrizione, attivita_incluse, condizioni, attivita_escluse, prezzo_base, immagine_url, ordine, attivo, updated_at";
const PORTFOLIO_COLS =
  "id, service_id, titolo, cliente, settore, descrizione, risultato, immagine_url, link_url, ordine";

function svc(chiave: string) {
  return CATALOG.find((c) => c.key === chiave) ?? null;
}

/** Indice vetrina PUBBLICO: solo servizi attivi, ordinati. */
export async function getVetrinaPubblica(): Promise<VetrinaServizio[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("service_catalog")
    .select(SERVICE_COLS)
    .eq("attivo", true)
    .order("ordine", { ascending: true });
  const rows = (data ?? []) as unknown as ServiceCatalogRow[];
  return rows.map((row) => ({ row, service: svc(row.chiave), portfolio: [] }));
}

/** Dettaglio vetrina PUBBLICO per chiave (solo se attivo), con portfolio. */
export async function getServizioPubblico(
  chiave: string,
): Promise<VetrinaServizio | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("service_catalog")
    .select(SERVICE_COLS)
    .eq("chiave", chiave)
    .eq("attivo", true)
    .maybeSingle();
  const row = data as unknown as ServiceCatalogRow | null;
  if (!row) return null;
  const { data: pf } = await db
    .from("portfolio_items")
    .select(PORTFOLIO_COLS)
    .eq("service_id", row.id)
    .order("ordine", { ascending: true });
  return {
    row,
    service: svc(row.chiave),
    portfolio: (pf ?? []) as unknown as PortfolioItemRow[],
  };
}

/** Lista INTERNA (staff): tutti i servizi, anche non attivi. */
export async function listServiziInterni(): Promise<ServiceCatalogRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_catalog")
    .select(SERVICE_COLS)
    .order("ordine", { ascending: true });
  return (data ?? []) as unknown as ServiceCatalogRow[];
}

export interface LavoroItem {
  id: string;
  titolo: string;
  cliente: string | null;
  settore: string | null;
  descrizione: string | null;
  risultato: string | null;
  immagine_url: string | null;
  link_url: string | null;
  servizioChiave: string | null;
  servizioTitolo: string | null;
}

/** Ultimi lavori (portfolio) dai servizi attivi — per il magazine del portale. */
export async function getUltimiLavori(limit = 12): Promise<LavoroItem[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("portfolio_items")
    .select(
      "id, titolo, cliente, settore, descrizione, risultato, immagine_url, link_url, created_at, service:service_catalog!portfolio_items_service_id_fkey(chiave, titolo, attivo)",
    )
    .order("created_at", { ascending: false })
    .limit(limit * 2); // margine per filtrare i servizi non attivi
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    titolo: string;
    cliente: string | null;
    settore: string | null;
    descrizione: string | null;
    risultato: string | null;
    immagine_url: string | null;
    link_url: string | null;
    service: { chiave: string; titolo: string; attivo: boolean } | null;
  }>;
  return rows
    .filter((r) => r.service?.attivo)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      titolo: r.titolo,
      cliente: r.cliente,
      settore: r.settore,
      descrizione: r.descrizione,
      risultato: r.risultato,
      immagine_url: r.immagine_url,
      link_url: r.link_url,
      servizioChiave: r.service?.chiave ?? null,
      servizioTitolo: r.service?.titolo ?? null,
    }));
}

/** Mappa chiave→prezzo_base per precompilare l'editor preventivo. */
export async function getPrezziBase(): Promise<Record<string, number | null>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_catalog")
    .select("chiave, prezzo_base");
  const out: Record<string, number | null> = {};
  for (const r of (data ?? []) as unknown as {
    chiave: string;
    prezzo_base: number | null;
  }[]) {
    out[r.chiave] = r.prezzo_base;
  }
  return out;
}

/** Dettaglio INTERNO (staff) per chiave, con portfolio (anche se non attivo). */
export async function getServizioInterno(
  chiave: string,
): Promise<VetrinaServizio | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_catalog")
    .select(SERVICE_COLS)
    .eq("chiave", chiave)
    .maybeSingle();
  const row = data as unknown as ServiceCatalogRow | null;
  if (!row) return null;
  const { data: pf } = await supabase
    .from("portfolio_items")
    .select(PORTFOLIO_COLS)
    .eq("service_id", row.id)
    .order("ordine", { ascending: true });
  return {
    row,
    service: svc(row.chiave),
    portfolio: (pf ?? []) as unknown as PortfolioItemRow[],
  };
}
