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

export function dataIt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
