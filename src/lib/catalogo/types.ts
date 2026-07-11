import type { CatalogService } from "@/lib/catalog";

// Riga di contenuto (DB).
export interface ServiceCatalogRow {
  id: string;
  chiave: string;
  titolo: string;
  sottotitolo: string | null;
  descrizione: string | null;
  attivita_incluse: string[];
  condizioni: string[];
  attivita_escluse: string[];
  prezzo_base: number | null;
  immagine_url: string | null;
  ordine: number;
  attivo: boolean;
  updated_at: string;
}

export interface PortfolioItemRow {
  id: string;
  service_id: string;
  titolo: string;
  cliente: string | null;
  settore: string | null;
  descrizione: string | null;
  risultato: string | null;
  immagine_url: string | null;
  link_url: string | null;
  ordine: number;
}

// Vista di vetrina: contenuto DB + struttura tecnica dal codice (per chiave).
export interface VetrinaServizio {
  row: ServiceCatalogRow;
  service: CatalogService | null; // da CATALOG (ricorrente/unaTantum/opzioni)
  portfolio: PortfolioItemRow[];
}
