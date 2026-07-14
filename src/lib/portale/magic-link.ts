import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://clienti.digital-discovery.it";

/**
 * Genera un link di accesso automatico (magic link) alla dashboard cliente,
 * da inserire nelle nostre email brandizzate. Ritorna null se non generabile
 * (in tal caso il chiamante ripiega sul link alla pagina di accesso).
 */
export async function generaMagicLink(
  email: string,
  next = "/portale",
): Promise<string | null> {
  try {
    const db = createAdminClient();
    const { data, error } = await db.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${SITE}/auth/callback?next=${next}` },
    });
    if (error || !data) return null;
    return data.properties?.action_link ?? null;
  } catch {
    return null;
  }
}
