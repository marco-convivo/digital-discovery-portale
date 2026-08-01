// Dati del creditore per il mandato SEPA SDD (B2B). Gli addebiti veri li invia
// Marco via Banca Sella SBS; qui raccogliamo solo mandato + IBAN.

export const SEPA_CREDITORE = {
  nome: "Digital Discovery SRL",
  indirizzo: "Piazzale Sant'Antonio 7 - 67100, L'Aquila (AQ) - ITALIA",
  creditorId: "IT210010000002132190667",
} as const;

// Testo del mandato accettato dal debitore (fornito da Digital Discovery).
export const SEPA_MANDATO_TESTO =
  "La sottoscrizione del presente mandato comporta a) l'autorizzazione a Digital Discovery SRL a richiedere alla Banca del debitore l'addebito del suo conto e b) l'autorizzazione alla Banca del debitore di procedere a tale addebito conformemente alle disposizioni impartite da Digital Discovery SRL. Il presente mandato è riservato esclusivamente ai rapporti tra imprese. Il debitore non ha diritto al rimborso dalla propria Banca successivamente all'addebito sul suo conto, ma ha diritto di chiedere alla propria Banca che il suo conto non venga addebitato fino alla data in cui il pagamento è dovuto.";

/** Normalizza un IBAN (maiuscolo, senza spazi). */
export function normalizeIban(v: string): string {
  return v.replace(/\s+/g, "").toUpperCase();
}

/** Validazione IBAN: formato + checksum mod-97 (ISO 13616). */
export function isValidIban(input: string): boolean {
  const iban = normalizeIban(input);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const expanded = rearranged.replace(/[A-Z]/g, (ch) =>
    String(ch.charCodeAt(0) - 55),
  );
  // mod 97 su stringa lunga, a blocchi
  let remainder = 0;
  for (let i = 0; i < expanded.length; i += 7) {
    remainder = Number(String(remainder) + expanded.slice(i, i + 7)) % 97;
  }
  return remainder === 1;
}
