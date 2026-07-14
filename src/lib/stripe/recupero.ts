import "server-only";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppSettingsAdmin } from "@/lib/settings/app-settings";
import { ALIQUOTA_IVA } from "@/lib/format";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

// Token non guessabile per la pagina pubblica di recupero.
function nuovoToken(): string {
  return `rec_${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * Prepara il recupero di una rata insoluta: garantisce un token, imposta l'URL
 * della NOSTRA pagina di pagamento e segna il recupero come avviato.
 * Il PaymentIntent vero si crea al caricamento della pagina (vedi ensureRecoveryContext).
 */
export async function creaLinkRecupero(
  paymentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const db = createAdminClient();
  const { data: p } = await db
    .from("payments")
    .select("id, importo, recovery_token")
    .eq("id", paymentId)
    .maybeSingle();
  if (!p) return { ok: false, error: "Rata non trovata." };
  const row = p as { id: string; importo: number | null; recovery_token: string | null };

  const token = row.recovery_token ?? nuovoToken();
  const { maggiorazione_insoluto } = await getAppSettingsAdmin();
  const url = `${SITE}/recupero/${token}`;

  await db
    .from("payments")
    .update({
      recovery_token: token,
      recovery_url: url,
      maggiorazione: Number(maggiorazione_insoluto ?? 0),
      recovery_stato: "link_inviato",
    })
    .eq("id", paymentId);

  return { ok: true, url };
}

export interface RecoveryContext {
  clientSecret: string;
  publishableKey: string;
  ragioneSociale: string;
  numeroRata: number | null;
  netto: number; // rata + maggiorazione, netto
  maggiorazione: number;
  giaPagato: boolean;
}

/**
 * Carica la rata dal token e crea un PaymentIntent (carta) per
 * (rata + maggiorazione) × 1,22 (LORDO IVA). Se già saldata → giaPagato=true.
 */
export async function ensureRecoveryContext(
  token: string,
): Promise<RecoveryContext | null> {
  const db = createAdminClient();
  const { data: p } = await db
    .from("payments")
    .select(
      "id, importo, numero_rata, stato, recovery_stato, maggiorazione, client:clients!payments_client_id_fkey(ragione_sociale, email)",
    )
    .eq("recovery_token", token)
    .maybeSingle();
  if (!p) return null;
  const row = p as unknown as {
    id: string;
    importo: number | null;
    numero_rata: number | null;
    stato: string;
    recovery_stato: string;
    maggiorazione: number | null;
    client: { ragione_sociale: string; email: string | null } | null;
  };
  const cli = row.client;
  if (!cli) return null;

  const { maggiorazione_insoluto } = await getAppSettingsAdmin();
  const magg = Number(row.maggiorazione ?? maggiorazione_insoluto ?? 0);
  const nettoRata = Number(row.importo ?? 0);
  const netto = nettoRata + magg;

  // Già saldato (pagamento riuscito o recupero chiuso): nessun PaymentIntent.
  const giaPagato = row.stato === "paid" || row.recovery_stato === "recuperato";
  if (giaPagato) {
    return {
      clientSecret: "",
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      ragioneSociale: cli.ragione_sociale,
      numeroRata: row.numero_rata,
      netto,
      maggiorazione: magg,
      giaPagato: true,
    };
  }

  const lordoCents = Math.round(netto * (1 + ALIQUOTA_IVA) * 100);
  const pi = await getStripe().paymentIntents.create({
    amount: lordoCents,
    currency: "eur",
    payment_method_types: ["card"],
    description: `Saldo insoluto rata ${row.numero_rata ?? ""} — ${cli.ragione_sociale}`,
    receipt_email: cli.email ?? undefined,
    metadata: { payment_id: row.id, tipo: "recupero" },
  });

  return {
    clientSecret: pi.client_secret!,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    ragioneSociale: cli.ragione_sociale,
    numeroRata: row.numero_rata,
    netto,
    maggiorazione: magg,
    giaPagato: false,
  };
}
