import "server-only";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppSettingsAdmin } from "@/lib/settings/app-settings";
import { ALIQUOTA_IVA } from "@/lib/format";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

/**
 * Crea una Checkout Session (carta) per la rata insoluta + maggiorazione,
 * calcolata LORDA (× 1,22) come tutti gli importi verso Stripe. Salva sulla rata
 * checkout id/url + snapshot maggiorazione + recovery_stato='link_inviato'.
 */
export async function creaLinkRecupero(
  paymentId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const db = createAdminClient();
  const { data: p } = await db
    .from("payments")
    .select(
      "id, importo, numero_rata, recovery_url, client:clients!payments_client_id_fkey(ragione_sociale, email)",
    )
    .eq("id", paymentId)
    .maybeSingle();
  if (!p) return { ok: false, error: "Rata non trovata." };
  const row = p as unknown as {
    importo: number | null;
    numero_rata: number | null;
    recovery_url: string | null;
    client: { ragione_sociale: string; email: string | null } | null;
  };
  const cli = row.client;
  if (!cli) return { ok: false, error: "Cliente non trovato." };

  const { maggiorazione_insoluto } = await getAppSettingsAdmin();
  const nettoRata = Number(row.importo ?? 0);
  const magg = Number(maggiorazione_insoluto ?? 0);
  const lordoCents = Math.round((nettoRata + magg) * (1 + ALIQUOTA_IVA) * 100);
  if (lordoCents < 50)
    return { ok: false, error: "Importo troppo basso per un pagamento carta." };

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: cli.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Saldo insoluto rata ${row.numero_rata ?? ""} — ${cli.ragione_sociale}`,
          },
          unit_amount: lordoCents,
        },
        quantity: 1,
      },
    ],
    metadata: { payment_id: paymentId },
    success_url: `${SITE}/recupero/ok`,
    cancel_url: `${SITE}/recupero/annullato`,
  });

  if (!session.url)
    return { ok: false, error: "Stripe non ha restituito l'URL di pagamento." };

  await db
    .from("payments")
    .update({
      recovery_checkout_id: session.id,
      recovery_url: session.url,
      maggiorazione: magg,
      recovery_stato: "link_inviato",
    })
    .eq("id", paymentId);

  return { ok: true, url: session.url };
}
