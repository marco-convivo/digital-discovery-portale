// Formattazione numeri e date — UNICA fonte di verità.
//
// Prima: 4 versioni di formattazione valuta (con output diversi sulla stessa
// cifra) e 3 di formattazione data sparse nei componenti. Qualsiasi nuova
// esigenza di formato si aggiunge qui, non inline.

import { ALIQUOTA_IVA } from "@/lib/config";

export { ALIQUOTA_IVA };

/** Importo in euro, sempre con separatore migliaia: "4.188,00 €". */
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

/** Come euro() ma senza simbolo: "4.188,00" (campi PDF/DocuSeal). */
export function euroSenzaSimbolo(n: number | null | undefined): string {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    useGrouping: true,
  }).format(Number(n ?? 0));
}

/** Importo lordo (IVA inclusa) dal netto/imponibile. */
export function conIva(netto: number | null | undefined): number {
  return Math.round(Number(netto ?? 0) * (1 + ALIQUOTA_IVA) * 100) / 100;
}

/** Data estesa: "12 agosto 2026". */
export function dataIt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/** Data compatta: "12 ago" (timeline, log). */
export function dataBreve(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/** Data numerica: "12/08/2026" (contratti, documenti formali). */
export function dataNumerica(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}
