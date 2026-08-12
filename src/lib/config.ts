// Configurazione applicativa — UNICA fonte di verità.
//
// Prima di questo modulo la costante SITE era ricopiata in 11 file e l'email
// admin hardcoded in 4: ogni valore d'ambiente vive qui e si importa da qui.

/** URL pubblico dell'app (portale cliente + pagine pubbliche). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

/** Etichetta leggibile del dominio (footer email, testi). */
export const SITE_LABEL = SITE_URL.replace(/^https?:\/\//, "");

/** Destinatario delle notifiche operative interne (alert, assistenza). */
export const EMAIL_ADMIN =
  process.env.EMAIL_ADMIN ?? "marco@convivostudio.it";

/**
 * Aliquota IVA applicata agli addebiti. Gli importi nel sistema sono NETTI
 * (imponibile); l'IVA si aggiunge all'addebito e alle diciture "IVA inclusa".
 */
export const ALIQUOTA_IVA = 0.22;
