export function euro(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    // l'it-IT di default non raggruppa i 4 cifre (4188); per importi/contratti
    // vogliamo sempre il separatore migliaia (4.188,00 €).
    useGrouping: true,
  }).format(n);
}

// Gli importi nel sistema sono NETTI (imponibile). L'IVA si aggiunge per
// l'addebito Stripe e per la dicitura "IVA inclusa" nella UI.
export const ALIQUOTA_IVA = 0.22;

/** Importo lordo (IVA inclusa) dal netto/imponibile. */
export function conIva(netto: number | null | undefined): number {
  return Math.round(Number(netto ?? 0) * (1 + ALIQUOTA_IVA) * 100) / 100;
}

export function dataIt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
