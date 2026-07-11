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
