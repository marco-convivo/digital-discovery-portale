// Reason code SEPA (R-transaction) → messaggio in italiano per lo staff.
const REASONS: Record<string, string> = {
  AC01: "Numero di conto errato.",
  AC04: "Conto chiuso.",
  AC06: "Conto bloccato.",
  AM04: "Fondi insufficienti sul conto.",
  AM05: "Addebito duplicato.",
  BE05: "Creditore non riconosciuto dalla banca del cliente.",
  MD01: "Nessun mandato valido / mandato non riconosciuto dalla banca.",
  MD06: "Addebito contestato/stornato dal cliente.",
  MD07: "Cliente deceduto.",
  MS02: "Rifiuto del debitore (cliente).",
  MS03: "Rifiuto della banca (motivo non specificato).",
  SL01: "Rifiuto per servizi specifici della banca del cliente.",
  // codici carta più comuni (recupero via carta)
  insufficient_funds: "Fondi insufficienti.",
  card_declined: "Carta rifiutata.",
  expired_card: "Carta scaduta.",
};

/** Normalizza il codice di fallimento e ritorna {code, reason} in italiano. */
export function motivoInsoluto(code: string | null | undefined): {
  code: string | null;
  reason: string;
} {
  const raw = (code ?? "").trim();
  if (!raw) return { code: null, reason: "Addebito non riuscito." };
  // i reason SEPA sono maiuscoli (AC04); i codici carta sono snake_case
  const key = REASONS[raw] ? raw : raw.toUpperCase();
  const reason = REASONS[raw] ?? REASONS[key] ?? "Addebito non riuscito.";
  return { code: raw.toUpperCase(), reason };
}
