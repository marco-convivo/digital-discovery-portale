// Generazione del piano rate — UNICA fonte di verità.
//
// Usata sia dall'anteprima 7b (client, nessun DB) sia dai generatori reali che
// scrivono le righe `payments` alla firma / mandato / setup:
//   · src/lib/sepa/actions.ts      (mandato SDD manuale)
//   · src/lib/stripe/setup.ts      (subscription on-session)
//   · src/lib/stripe/activate.ts   (setup_intent off-session)
//   · src/lib/clienti/manual.ts    (onboarding cliente già attivo)
//
// Regola: ricorrente → N = rate_num rate da `rata_mensile`; una_tantum/acconto →
// 1 rata da `importo_totale`. La scadenza della rata i è `primaScadenza + i mesi`
// (default oggi). Gli importi sono NETTI (l'IVA si aggiunge all'addebito).

export type QuoteTipo = "ricorrente" | "una_tantum" | "acconto";

export interface RataGenerata {
  numero_rata: number;
  importo: number;
  scadenza: string; // YYYY-MM-DD
}

export interface GeneraRateInput {
  tipo: QuoteTipo;
  importoTotale: number | null | undefined;
  rataMensile: number | null | undefined;
  rateNum: number | null | undefined;
  /** Data della prima rata (ISO YYYY-MM-DD). Se assente → oggi. */
  primaScadenza?: string | null;
}

/** Data odierna come YYYY-MM-DD (UTC, coerente con toISOString). */
export function oggiIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Aggiunge `mesi` a una data ISO (YYYY-MM-DD) senza deriva di fuso. */
export function addMesi(iso: string, mesi: number): string {
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + mesi);
  return d.toISOString().slice(0, 10);
}

export function generaRate(input: GeneraRateInput): RataGenerata[] {
  const ricorrente = input.tipo === "ricorrente";
  const base =
    input.primaScadenza && input.primaScadenza.length >= 10
      ? input.primaScadenza.slice(0, 10)
      : oggiIso();
  const rateNum = ricorrente ? Math.max(1, Math.trunc(input.rateNum ?? 12)) : 1;
  const importo = ricorrente
    ? Number(input.rataMensile ?? 0)
    : Number(input.importoTotale ?? 0);
  return Array.from({ length: rateNum }, (_, i) => ({
    numero_rata: i + 1,
    importo,
    scadenza: addMesi(base, i),
  }));
}
