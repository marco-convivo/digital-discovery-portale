// Dati per il pagamento con bonifico (una tantum). Coincidono con
// app_settings.iban_bonifico; qui come costante per le pagine pubbliche /paga.
export const BONIFICO = {
  intestatario: "Digital Discovery SRL",
  iban: "IT47L0326822300052573507410",
  banca: "Banca Sella",
  emailContabile: "info@digital-discovery.it",
} as const;
