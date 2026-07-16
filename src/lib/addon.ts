// Servizio aggiuntivo a testo libero (fuori catalogo), per rinnovi/extra.
export interface Addon {
  descrizione: string;
  prezzo: number;
  tipo: "ricorrente" | "una_tantum";
  durata?: number; // mesi, solo se ricorrente
}

// Contributo al totale contratto: ricorrente = prezzo × mesi; una tantum = prezzo.
export function addonContributo(a: Addon): number {
  const p = Number(a.prezzo) || 0;
  return a.tipo === "ricorrente" ? p * (a.durata ?? 12) : p;
}

// Normalizza il jsonb salvato (difensivo: filtra righe senza descrizione).
export function parseAddons(raw: unknown): Addon[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => x as Partial<Addon>)
    .filter((x) => typeof x?.descrizione === "string" && x.descrizione.trim())
    .map((x) => ({
      descrizione: String(x.descrizione).trim(),
      prezzo: Number(x.prezzo) || 0,
      tipo: x.tipo === "una_tantum" ? "una_tantum" : "ricorrente",
      durata: x.tipo === "ricorrente" ? (Number(x.durata) || 12) : undefined,
    }));
}

// Testo per il campo DocuSeal "addon" (una riga per addon).
export function addonText(addons: Addon[]): string {
  return addons
    .map((a) => {
      const t =
        a.tipo === "ricorrente"
          ? `€${a.prezzo}/mese × ${a.durata ?? 12} mesi`
          : `€${a.prezzo} una tantum`;
      return `• ${a.descrizione} (${t})`;
    })
    .join("\n");
}
