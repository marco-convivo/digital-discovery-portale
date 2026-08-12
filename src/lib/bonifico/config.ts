// Dati statici per il pagamento con bonifico (una tantum).
// L'IBAN NON vive più qui: è in app_settings.iban_bonifico (unica fonte,
// modificabile dalle impostazioni) — questo fallback copre il primo avvio.
export const BONIFICO = {
  intestatario: "Digital Discovery SRL",
  banca: "Banca Sella",
  emailContabile: "info@digital-discovery.it",
} as const;

export const IBAN_FALLBACK = "IT47L0326822300052573507410";
