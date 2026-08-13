// Dati statici per il pagamento con bonifico (una tantum).
// L'IBAN NON vive più qui: è in app_settings.iban_bonifico (unica fonte,
// modificabile dalle impostazioni) — questo fallback copre il primo avvio.
export const BONIFICO = {
  intestatario: "Digital Discovery SRL",
  banca: "Banca Sella",
  emailContabile: "info@digital-discovery.it",
} as const;

export const IBAN_FALLBACK = "IT47L0326822300052573507410";

// Canali per avvisare dell'avvenuto bonifico (riscontro contabile).
export const CONTATTI_BONIFICO = {
  email: "info@digital-discovery.it",
  whatsappNumero: "393311093149", // per wa.me
  whatsappDisplay: "+39 331 109 3149",
} as const;
