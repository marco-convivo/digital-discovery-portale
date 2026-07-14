import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emailBrand } from "@/lib/email/templates";
import { generaMagicLink } from "@/lib/portale/magic-link";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

/**
 * Avvisa il CLIENTE che una rata è rimasta in sospeso e lo porta nella sua
 * dashboard (magic link) per saldarla con carta o bonifico. Best-effort.
 */
export async function inviaAvvisoInsolutoCliente(
  paymentId: string,
): Promise<void> {
  try {
    const db = createAdminClient();
    const { data: p } = await db
      .from("payments")
      .select(
        "numero_rata, client:clients!payments_client_id_fkey(ragione_sociale, email)",
      )
      .eq("id", paymentId)
      .maybeSingle();
    const row = p as unknown as {
      numero_rata: number | null;
      client: { ragione_sociale: string; email: string | null } | null;
    } | null;
    const email = row?.client?.email;
    if (!email) return;

    const url = (await generaMagicLink(email, "/portale")) ?? `${SITE}/accedi`;

    const html = emailBrand({
      heading: "Una rata è rimasta in sospeso",
      paragraphs: [
        `Gentile <b>${row?.client?.ragione_sociale ?? "Cliente"}</b>, l'addebito della rata ${row?.numero_rata ?? ""} non è andato a buon fine.`,
        "Accedi alla tua area per saldarla in pochi istanti, con carta o bonifico.",
      ],
      cta: { label: "Vai alla tua area e salda", url },
      footerNote:
        "Il link ti porta direttamente alla tua dashboard. Se scade, puoi accedere da clienti.digital-discovery.it.",
    });

    await sendEmail({
      to: email,
      subject: "Una rata è rimasta in sospeso — Digital Discovery",
      html,
    });
  } catch {
    // best-effort
  }
}
