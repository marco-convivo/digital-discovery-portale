import type { CatalogService } from "@/lib/catalog";

// Categoria commerciale del servizio → etichetta + tono colore.
// ricorrente = violetto (servizio continuativo); una tantum = menta (quick win);
// progetto = neutro (build importante).
export type Tone = "violet" | "mint" | "neutral";

export function categoria(service: CatalogService | null): {
  label: string;
  tone: Tone;
} {
  if (service?.ricorrente) return { label: "Ricorrente", tone: "violet" };
  if (service?.unaTantum) return { label: "Una tantum", tone: "mint" };
  return { label: "Progetto", tone: "neutral" };
}

export function suffissoPrezzo(service: CatalogService | null): string | null {
  return service?.ricorrente
    ? "/mese"
    : service?.unaTantum
      ? "una tantum"
      : null;
}

// Chip categoria su superficie chiara
export const TONE_BADGE: Record<Tone, string> = {
  violet: "bg-violet-soft text-on-violet",
  mint: "bg-mint-soft text-on-mint",
  neutral: "bg-card-2 text-text-2",
};

// Chip categoria su superficie scura (pannello ink)
export const TONE_BADGE_DARK: Record<Tone, string> = {
  violet: "bg-violet text-on-violet",
  mint: "bg-mint text-on-mint",
  neutral: "bg-on-ink/15 text-on-ink",
};

// Pannello placeholder (monogramma) tinto per categoria
export const TONE_PLACEHOLDER: Record<Tone, string> = {
  violet: "bg-violet-soft text-violet/45",
  mint: "bg-mint-soft text-on-mint/25",
  neutral: "bg-card-2 text-ink/10",
};
